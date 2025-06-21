use dotenv::dotenv;
use std::env;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables
    dotenv().ok();
    
    // Get database URL
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    // Run migrations
    open_context_vault::storage::migrations::run_migrations(&database_url).await?;
    
    println!("Migrations completed successfully");
    
    Ok(())
}
