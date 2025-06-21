mod adapters;
mod api;
mod consent_manager;
mod context_management;
mod encryption;
mod identity;
mod policy_engine;
mod storage;
mod utils;

use actix_cors::Cors;
use actix_web::{middleware, web, App, HttpServer};
use dotenv::dotenv;
use std::env;
use tracing_actix_web::TracingLogger;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables
    dotenv().ok();
    
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();
    
    // Initialize database connection pool (still needed for identity and consent)
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = sqlx::PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to PostgreSQL");
    
    // Initialize the encryption service
    let encryption_service = encryption::service::EncryptionService::new();
    
    // Initialize policy engine
    let policy_engine = policy_engine::service::PolicyEngine::new();
    
    // Initialize context management service with mem0
    let context_service = context_management::service::ContextService::new_with_mem0(
        encryption_service.clone(),
    );
    
    // Initialize consent manager
    let consent_manager = consent_manager::service::ConsentManager::new(
        pool.clone(),
        policy_engine.clone(),
    );
    
    // Initialize identity service
    let identity_service = identity::service::IdentityService::new(pool.clone());
    
    // Application state
    let app_state = web::Data::new(api::AppState {
        pool,
        context_service,
        consent_manager,
        encryption_service,
        policy_engine,
        identity_service,
    });
    
    // Build GraphQL schema
    let schema = api::schema::create_schema();
    
    // Start HTTP server
    let bind_address = env::var("BIND_ADDRESS").unwrap_or_else(|_| "0.0.0.0:8000".to_string());
    
    tracing::info!("Starting server at {}", bind_address);
    
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
        
        App::new()
            .wrap(TracingLogger::default())
            .wrap(middleware::Compress::default())
            .wrap(middleware::NormalizePath::trim())
            .wrap(cors)
            .app_data(app_state.clone())
            .app_data(web::Data::new(schema.clone()))
            .configure(api::configure)
    })
    .bind(bind_address)?
    .run()
    .await
}
