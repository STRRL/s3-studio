use wasm_bindgen::prelude::*;
use opendal::{Operator, services};
use serde::{Serialize, Deserialize};
use futures::stream::TryStreamExt;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);
}

#[derive(Serialize, Deserialize)]
pub struct FileEntry {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub is_dir: bool,
    pub last_modified: Option<String>,
}

#[wasm_bindgen]
pub struct S3Client {
    operator: Operator,
}

#[wasm_bindgen]
impl S3Client {
    #[wasm_bindgen(constructor)]
    pub fn new(
        access_key_id: &str,
        secret_access_key: &str,
        region: &str,
        bucket: &str,
        endpoint: Option<String>,
    ) -> Result<S3Client, JsValue> {
        let mut builder = services::S3::default()
            .access_key_id(access_key_id)
            .secret_access_key(secret_access_key)
            .region(region)
            .bucket(bucket);

        if let Some(ep) = endpoint {
            builder = builder.endpoint(&ep);
        }

        let operator = Operator::new(builder)
            .map_err(|e| JsValue::from_str(&format!("Failed to create operator: {}", e)))?
            .finish();

        log(&format!("S3Client initialized for bucket: {}", bucket));

        Ok(S3Client { operator })
    }

    #[wasm_bindgen]
    pub async fn list(&self, path: &str) -> Result<JsValue, JsValue> {
        log(&format!("Listing path: {}", path));

        let lister = self.operator
            .lister(path)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to create lister: {}", e)))?;

        let mut entries = Vec::new();

        let items: Vec<_> = lister.try_collect().await
            .map_err(|e| JsValue::from_str(&format!("Failed to collect entries: {}", e)))?;

        // Normalize the prefix for filtering direct children
        let prefix = if path == "/" { "" } else { path.trim_start_matches('/') };

        for entry in items {
            let metadata = entry.metadata();
            let entry_path = entry.path().to_string();

            // Get the relative path by removing the prefix
            let relative_path = if prefix.is_empty() {
                entry_path.as_str()
            } else {
                entry_path.strip_prefix(prefix).unwrap_or(&entry_path)
            };

            // Skip if relative path is empty (it's the directory itself)
            if relative_path.is_empty() || relative_path == "/" {
                continue;
            }

            // Only include direct children:
            // - For directories: relative path should be "name/" (one segment + trailing slash)
            // - For files: relative path should be "name" (one segment, no slash)
            let relative_trimmed = relative_path.trim_start_matches('/').trim_end_matches('/');
            if relative_trimmed.contains('/') {
                // This is a nested entry, skip it
                continue;
            }

            let name = relative_trimmed.to_string();

            // Skip empty names
            if name.is_empty() {
                continue;
            }

            entries.push(FileEntry {
                path: entry_path.clone(),
                name,
                size: metadata.content_length(),
                is_dir: metadata.is_dir(),
                last_modified: metadata.last_modified().map(|t| t.to_string()),
            });
        }

        log(&format!("Found {} entries", entries.len()));

        serde_wasm_bindgen::to_value(&entries)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    #[wasm_bindgen]
    pub async fn read(&self, path: &str) -> Result<Vec<u8>, JsValue> {
        log(&format!("Reading file: {}", path));

        let data = self.operator
            .read(path)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to read: {}", e)))?;

        log(&format!("Read {} bytes", data.len()));

        Ok(data.to_vec())
    }

    #[wasm_bindgen]
    pub async fn write(&self, path: &str, data: Vec<u8>) -> Result<(), JsValue> {
        log(&format!("Writing {} bytes to {}", data.len(), path));

        self.operator
            .write(path, data)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to write: {}", e)))?;

        log("Write successful");

        Ok(())
    }

    #[wasm_bindgen]
    pub async fn delete(&self, path: &str) -> Result<(), JsValue> {
        log(&format!("Deleting: {}", path));

        self.operator
            .delete(path)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to delete: {}", e)))?;

        log("Delete successful");

        Ok(())
    }

    #[wasm_bindgen]
    pub async fn stat(&self, path: &str) -> Result<JsValue, JsValue> {
        log(&format!("Getting metadata for: {}", path));

        let metadata = self.operator
            .stat(path)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to stat: {}", e)))?;

        let entry = FileEntry {
            path: path.to_string(),
            name: path.trim_end_matches('/').split('/').last().unwrap_or(path).to_string(),
            size: metadata.content_length(),
            is_dir: metadata.is_dir(),
            last_modified: metadata.last_modified().map(|t| t.to_string()),
        };

        serde_wasm_bindgen::to_value(&entry)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    #[wasm_bindgen]
    pub async fn rename(&self, from: &str, to: &str) -> Result<(), JsValue> {
        log(&format!("Renaming: {} -> {}", from, to));

        self.operator
            .rename(from, to)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to rename: {}", e)))?;

        log("Rename successful");

        Ok(())
    }

    #[wasm_bindgen]
    pub async fn create_dir(&self, path: &str) -> Result<(), JsValue> {
        log(&format!("Creating directory: {}", path));

        self.operator
            .create_dir(path)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to create directory: {}", e)))?;

        log("Directory created successfully");

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    fn test_file_entry_serialization() {
        let entry = FileEntry {
            path: "test/file.txt".to_string(),
            name: "file.txt".to_string(),
            size: 1024,
            is_dir: false,
            last_modified: Some("2024-01-01".to_string()),
        };

        let serialized = serde_wasm_bindgen::to_value(&entry);
        assert!(serialized.is_ok());
    }
}
