use tiny_http::{Server, Response, Header};
use serde::{Serialize, Deserialize};
use std::str::FromStr;

#[derive(Serialize, Deserialize)]
struct HealthResponse {
    status: String,
    version: String,
}

fn main() {
    // Create a server listening on port 8000
    let server = Server::http("0.0.0.0:8000").unwrap();
    println!("Server running at http://0.0.0.0:8000/");

    for request in server.incoming_requests() {
        let url = request.url();
        
        match url {
            "/" => {
                let response = Response::from_string("Open Context Vault API")
                    .with_header(Header::from_str("Content-Type: text/plain").unwrap());
                request.respond(response).unwrap();
            },
            "/api/health" => {
                let health = HealthResponse {
                    status: "ok".to_string(),
                    version: env!("CARGO_PKG_VERSION").to_string(),
                };
                
                let json = serde_json::to_string(&health).unwrap();
                let response = Response::from_string(json)
                    .with_header(Header::from_str("Content-Type: application/json").unwrap());
                request.respond(response).unwrap();
            },
            _ => {
                let response = Response::from_string("Not Found")
                    .with_status_code(404);
                request.respond(response).unwrap();
            }
        }
    }
}
