# Security Research: Browser-Based S3 File Explorer with WASM and OpenDAL

This document provides comprehensive security research and recommendations for building a browser-based S3 file explorer using WebAssembly (WASM) and OpenDAL.

## 1. CORS and Browser Security

### 1.1 S3 CORS Configuration Requirements

#### Core Concepts
Cross-Origin Resource Sharing (CORS) is essential for browser-based S3 access. By default, browsers enforce the Same-Origin Policy (SOP), which restricts web pages from making HTTP requests to different origins. CORS configuration allows selective cross-origin access to S3 resources.

#### Essential CORS Configuration Elements

A production-ready S3 CORS configuration should include:

```json
[
  {
    "AllowedHeaders": ["Authorization", "Content-Type", "x-amz-date", "x-amz-content-sha256"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": ["ETag", "x-amz-request-id"],
    "MaxAgeSeconds": 3000
  }
]
```

#### Security Best Practices

1. **Restrict Origins**: Never use wildcard `"*"` for `AllowedOrigins` in production. Always specify exact domains.

2. **Minimize Allowed Methods**: Only include methods required for your application. Avoid DELETE unless absolutely necessary.

3. **Limit Exposed Headers**: Only expose headers your frontend needs (e.g., ETag for caching validation).

4. **Use MaxAgeSeconds**: Cache preflight responses (3000 seconds recommended) to reduce unnecessary OPTIONS requests.

#### Critical Security Considerations

- **Preflight Requests**: Browsers send OPTIONS requests (preflight) for non-simple requests. S3 evaluates CORS configuration using the first matching CORSRule.

- **No Authentication on Preflight**: OPTIONS requests do not require authentication, which is important for public access scenarios but means CORS rules are your first line of defense.

- **Origin Header Requirement**: S3 only includes CORS headers if the request contains an Origin header. Testing with curl without Origin won't show CORS behavior.

- **JSON Format Required**: Modern S3 console requires CORS configuration in JSON format.

### 1.2 Browser Security Policies Affecting WASM

#### Same-Origin Policy and WASM
WebAssembly applications running in browsers are subject to the same Same-Origin Policy as JavaScript. WASM modules cannot bypass browser security restrictions and require proper CORS configuration when accessing S3 resources.

#### Content Security Policy (CSP)
When implementing WASM-based S3 file explorer, configure CSP directives:

```http
Content-Security-Policy:
  default-src 'self';
  connect-src 'self' https://{bucket-name}.s3.{region}.amazonaws.com;
  script-src 'self' 'wasm-unsafe-eval';
  img-src 'self' https://{bucket-name}.s3.{region}.amazonaws.com data:;
```

**Key CSP Directives for S3 Integration:**

1. **connect-src**: Must include S3 bucket URL for XHR/fetch requests
2. **img-src**: Required if displaying S3-hosted images
3. **media-src**: Needed for video/audio content from S3

**Important Notes:**

- S3 does not support setting CSP headers directly (it's not on S3's permitted headers whitelist)
- Use CloudFront with Lambda@Edge or Response Headers Policy to inject CSP headers
- CSP headers should be set via HTTP headers (not meta tags) for maximum security

### 1.3 Cross-Origin Resource Sharing Limitations

#### Browser Limitations

1. **Credential Inclusion**: Cross-origin requests with credentials require `Access-Control-Allow-Credentials: true` and cannot use wildcard origins.

2. **Cookie Restrictions**: Third-party cookies may be blocked by browser settings, affecting session management.

3. **Header Restrictions**: Only CORS-safelisted headers are sent automatically; custom headers trigger preflight requests.

#### S3-Specific Limitations

1. **CORS Rule Matching**: S3 uses the first matching rule, not the most specific. Order matters.

2. **Wildcard Matching**: AllowedHeaders supports wildcards, but use carefully to avoid over-permissive configurations.

3. **Propagation Delay**: CORS configuration changes may take several minutes to propagate.

### 1.4 Preflight Requests and OPTIONS Handling

#### Preflight Request Flow

1. Browser detects non-simple request (custom headers, PUT/DELETE methods, etc.)
2. Browser sends OPTIONS request with:
   - `Origin` header
   - `Access-Control-Request-Method` header
   - `Access-Control-Request-Headers` header
3. S3 evaluates CORS configuration
4. S3 responds with allowed methods and headers
5. Browser proceeds with actual request if preflight succeeds

#### Optimization Strategies

1. **Cache Preflight Responses**: Use `MaxAgeSeconds` (3000-86400 recommended) to minimize OPTIONS requests
2. **Minimize Custom Headers**: Fewer custom headers mean fewer preflight triggers
3. **Use Simple Requests**: GET/HEAD/POST with standard headers avoid preflight when possible

#### Common Preflight Issues

- **403 Forbidden on OPTIONS**: CORS configuration doesn't match request parameters
- **Missing CORS Headers**: Origin header not sent or doesn't match AllowedOrigins
- **Header Mismatch**: Requested headers not in AllowedHeaders list

## 2. Authentication Security

### 2.1 Secure Credential Management in Browser

#### Core Principles

**Never embed long-term AWS credentials in browser applications.** This is a fundamental security requirement that cannot be compromised.

#### Recommended Approaches

1. **Amazon Cognito Identity Pools**: Primary recommendation for browser applications
2. **Temporary Credentials via STS**: For server-backed architectures
3. **Presigned URLs**: For specific, time-limited operations

#### Browser-Specific Risks

Browser environments are inherently less secure because:
- Source code is visible and can be inspected
- Local storage can be accessed by browser extensions
- Memory dumps can expose credentials
- Users may be on compromised machines

### 2.2 Temporary Credentials Using STS

#### AWS Security Token Service (STS) Benefits

1. **Time-Limited Access**: Credentials expire automatically (configurable from minutes to hours)
2. **Reduced Exposure**: Compromised credentials have limited validity window
3. **Audit Trail**: CloudTrail logs all STS credential usage
4. **No Credential Rotation**: No need to manage long-term credential rotation

#### Implementation Pattern

For browser applications, use this flow:

```
User Authentication → Identity Provider (Cognito/OIDC) →
Identity Token → STS AssumeRoleWithWebIdentity →
Temporary AWS Credentials → S3 Access
```

#### STS API Options

1. **AssumeRoleWithWebIdentity**: For federated users (Cognito, Google, Facebook, OIDC)
2. **AssumeRole**: For cross-account or service-to-service access
3. **GetSessionToken**: For MFA-protected access

#### Critical Constraints

**Session Duration Limitations:**
- Default duration: 1 hour
- Maximum duration: 12 hours (for AssumeRole)
- Role session limit: 6 hours for EC2 instance profiles
- Presigned URLs expire when underlying credentials expire

**Security Best Practices:**

1. Configure shortest necessary duration for your use case
2. Implement credential refresh before expiration
3. Use role session name for tracking and auditing
4. Apply least-privilege IAM policies to assumed roles

### 2.3 Avoiding Exposure of AWS Credentials

#### Critical Don'ts

1. **Never commit credentials to source control**
   - No access keys in code
   - No credentials in environment files committed to git
   - Use .gitignore for local credential files

2. **Never expose credentials in client-side code**
   - No credentials in JavaScript/WASM bundles
   - No credentials in browser localStorage/sessionStorage
   - No credentials in URL parameters

3. **Never log credentials**
   - Sanitize logs to remove access keys
   - Avoid logging request headers containing Authorization

#### Recommended Patterns

**For Browser Applications:**

1. **Backend-for-Frontend (BFF) Pattern**
   ```
   Browser → BFF Server → Cognito/STS → AWS Services
   ```
   - BFF server handles credential exchange
   - Browser receives only temporary credentials or presigned URLs
   - Credentials never stored in browser

2. **Cognito Identity Pools**
   ```
   Browser → Cognito User Pool (Authentication) →
   Cognito Identity Pool (Authorization) →
   Temporary AWS Credentials
   ```
   - Industry standard for browser/mobile AWS access
   - Automatic credential refresh via SDK
   - Support for unauthenticated (guest) access

3. **Presigned URLs Only**
   ```
   Browser → Backend API → Generate Presigned URLs →
   Browser → S3 (with presigned URL)
   ```
   - No AWS credentials in browser at all
   - Backend controls access and generates URLs
   - Time-limited, operation-specific access

#### Credential Caching Strategy

When using temporary credentials:

```javascript
const credentialCache = {
  credentials: null,
  expiration: null,

  async getCredentials() {
    if (this.credentials && this.expiration > Date.now() + 300000) {
      return this.credentials;
    }

    const response = await fetchTemporaryCredentials();
    this.credentials = response.credentials;
    this.expiration = response.expiration;
    return this.credentials;
  }
};
```

- Cache credentials to avoid repeated STS calls
- Refresh proactively (5 minutes before expiration recommended)
- Clear cache on logout
- Use AWS SDK credential providers when available

### 2.4 Token Refresh Strategies

#### Challenge: Credential Expiration

Temporary credentials expire, requiring refresh mechanism for long-running applications. The challenge is maintaining seamless user experience while ensuring security.

#### Recommended Refresh Strategies

**1. Proactive Refresh (Recommended)**

Refresh credentials before expiration:

```javascript
class CredentialManager {
  constructor(refreshThresholdMs = 300000) {
    this.refreshThreshold = refreshThresholdMs;
    this.credentials = null;
    this.expiration = null;
  }

  async getCredentials() {
    if (this.needsRefresh()) {
      await this.refresh();
    }
    return this.credentials;
  }

  needsRefresh() {
    return !this.credentials ||
           Date.now() + this.refreshThreshold >= this.expiration;
  }

  async refresh() {
    const response = await this.fetchNewCredentials();
    this.credentials = response.credentials;
    this.expiration = response.expiration;
  }
}
```

**Benefits:**
- No service interruption
- Handles race conditions
- User never sees authentication errors

**2. Background Refresh**

Use scheduled refresh for active sessions:

```javascript
class BackgroundRefresher {
  constructor(credentialManager, intervalMs = 3000000) {
    this.manager = credentialManager;
    this.interval = intervalMs;
    this.timerId = null;
  }

  start() {
    this.timerId = setInterval(async () => {
      await this.manager.refresh();
    }, this.interval);
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
```

**3. Lazy Refresh with Retry**

Refresh on demand with automatic retry:

```javascript
async function requestWithRetry(operation, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const credentials = await credentialManager.getCredentials();
      return await operation(credentials);
    } catch (error) {
      if (isExpiredCredentialError(error) && attempt < maxRetries - 1) {
        await credentialManager.refresh();
        continue;
      }
      throw error;
    }
  }
}
```

#### AWS SDK Integration

AWS JavaScript SDK v3 provides built-in credential providers:

```javascript
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "us-east-1",
  credentials: fromCognitoIdentityPool({
    clientConfig: { region: "us-east-1" },
    identityPoolId: "IDENTITY_POOL_ID",
    logins: {
      "cognito-idp.us-east-1.amazonaws.com/USER_POOL_ID": idToken
    }
  })
});
```

**Benefits:**
- Automatic credential refresh
- No manual cache management
- Handles edge cases (race conditions, network errors)

#### Presigned URL Refresh Strategy

For presigned URLs with temporary credentials:

**Problem:** Presigned URLs expire when underlying credentials expire, regardless of URL expiration parameter.

**Solutions:**

1. **Short URL Lifetimes**: Generate URLs valid for actual credential lifetime
2. **URL Regeneration**: Regenerate URLs before credential expiration
3. **Use Long-Term Credentials for URL Generation**: If long URL lifetime needed (not recommended for browsers)

**Implementation:**

```javascript
class PresignedURLManager {
  constructor(credentialManager) {
    this.credentialManager = credentialManager;
    this.urlCache = new Map();
  }

  async getPresignedUrl(bucket, key, expiresIn = 3600) {
    const cacheKey = `${bucket}/${key}`;
    const cached = this.urlCache.get(cacheKey);

    if (cached && cached.validUntil > Date.now() + 300000) {
      return cached.url;
    }

    const credentials = await this.credentialManager.getCredentials();
    const url = await this.generatePresignedUrl(
      bucket,
      key,
      Math.min(expiresIn, this.getRemainingCredentialLifetime(credentials))
    );

    this.urlCache.set(cacheKey, {
      url,
      validUntil: Date.now() + (expiresIn * 1000)
    });

    return url;
  }

  getRemainingCredentialLifetime(credentials) {
    return Math.floor(
      (credentials.expiration - Date.now()) / 1000
    );
  }
}
```

#### Session Management Best Practices

1. **Track Session State**: Monitor user activity to determine when to refresh
2. **Handle Errors Gracefully**: Display clear messages on authentication failures
3. **Logout on Prolonged Inactivity**: Auto-logout after inactivity period
4. **Clear Credentials on Logout**: Remove all cached credentials and tokens
5. **Use Secure Storage**: If storing tokens, use secure browser APIs (not localStorage for sensitive tokens)

#### Monitoring and Alerting

Track credential refresh metrics:
- Refresh success/failure rate
- Time between refreshes
- Credential expiration warnings
- Failed API calls due to expired credentials

## 3. WASM Security Considerations

### 3.1 Memory Safety in WASM Context

#### Built-in Memory Safety Features

WebAssembly provides strong memory safety guarantees through its design:

**1. Isolated Linear Memory**
- Each WASM module has its own dedicated memory space
- Memory is separate from JavaScript heap
- Cannot access memory outside allocated region
- Bounds checking performed on all memory accesses

**2. Protected Call Stack**
- Call stack is inaccessible to WASM code
- Cannot be manipulated directly
- Prevents return-oriented programming (ROP) attacks

**3. Control Flow Integrity**
- All control transfers are type-checked
- Cannot jump to arbitrary code locations
- Cannot call into the middle of functions
- Indirect calls validated against function table

**4. No Pointer Arithmetic Across Modules**
- Cannot forge pointers to other modules
- Inter-module communication only through defined interfaces
- Module boundaries enforced by runtime

#### Memory Safety Limitations

Despite strong protections, WASM has important limitations:

**1. Memory Corruption Within Sandbox**

Classic memory bugs can still corrupt WASM memory:
- Buffer overflows within linear memory
- Use-after-free vulnerabilities
- Integer overflows affecting memory operations
- Out-of-bounds array access

**Critical Point:** While these bugs cannot escape the WASM sandbox, they can:
- Corrupt application data
- Bypass application-level security checks
- Enable denial of service
- Leak sensitive information within the sandbox

**2. Index Space vs Linear Memory**

Different memory regions have different guarantees:
- **Index Space** (local/global variables): Fixed-size, addressed by index, protected from overflows
- **Linear Memory**: Dynamic, addressable by byte offset, vulnerable to adjacent object overwrites

**3. No Garbage Collection**

WASM does not provide automatic memory management:
- Manual memory management required for languages like C/C++
- Memory leaks more problematic (no host cleanup)
- Requires explicit deallocation
- More critical in browser (no dedicated physical memory)

#### Secure Coding Practices

**1. Use Memory-Safe Languages**

Compile from memory-safe languages when possible:
- Rust (with ownership system)
- AssemblyScript
- Go (compiled to WASM)

Avoid or carefully review:
- C/C++ (manual memory management)
- Unsafe code blocks in Rust

**2. Enable Compiler Protections**

For C/C++ via Emscripten:

```bash
emcc source.c -o output.wasm \
  -fsanitize=cfi \
  -fsanitize=safe-stack \
  -fsanitize=address \
  -fstack-protector-strong \
  -D_FORTIFY_SOURCE=2
```

Key flags:
- `-fsanitize=cfi`: Control Flow Integrity
- `-fsanitize=address`: AddressSanitizer (catches memory errors)
- `-fstack-protector-strong`: Stack buffer overflow protection
- `-D_FORTIFY_SOURCE=2`: Runtime bounds checking

**3. Input Validation**

All data entering WASM module must be validated:

```rust
pub fn process_s3_data(data: &[u8], offset: usize, length: usize) -> Result<Vec<u8>> {
    if offset + length > data.len() {
        return Err("Invalid bounds");
    }

    if length > MAX_ALLOWED_SIZE {
        return Err("Data too large");
    }

    Ok(data[offset..offset+length].to_vec())
}
```

**4. Bounds Checking**

Always verify array/buffer access:

```rust
fn safe_array_access<T>(arr: &[T], index: usize) -> Option<&T> {
    arr.get(index)
}
```

**5. Safe Memory Management Patterns**

For manual memory management:

```c
void* allocate_buffer(size_t size) {
    if (size == 0 || size > MAX_BUFFER_SIZE) {
        return NULL;
    }

    void* ptr = malloc(size);
    if (ptr) {
        memset(ptr, 0, size);
    }
    return ptr;
}

void safe_free(void** ptr) {
    if (ptr && *ptr) {
        free(*ptr);
        *ptr = NULL;
    }
}
```

#### OpenDAL-Specific Considerations

When using OpenDAL in WASM:

1. **Credential Handling**: OpenDAL loads credentials from environment by default. In WASM:
   - No environment variables in browser
   - Must explicitly configure credentials
   - Disable environment loading: `disable_config_load`

2. **Memory Management**: OpenDAL is written in Rust, providing strong memory safety:
   - Ownership system prevents use-after-free
   - Bounds checking on slices
   - No null pointer dereferences
   - But: `unsafe` blocks bypass protections (review carefully)

3. **Buffer Handling**: When processing S3 data:
   ```rust
   use opendal::Operator;

   async fn read_s3_object(op: &Operator, path: &str) -> Result<Vec<u8>> {
       let data = op.read(path).await?;

       if data.len() > MAX_SAFE_SIZE {
           return Err("Object too large for browser memory");
       }

       Ok(data.to_vec())
   }
   ```

### 3.2 Sandboxing and Isolation

#### WASM Sandbox Architecture

**Core Isolation Guarantees:**

1. **Memory Isolation**
   - Each module operates in separate memory space
   - Cannot access host memory directly
   - Cannot access other modules' memory
   - All memory access bounds-checked

2. **Capability-Based Security**
   - WASM modules have no ambient authority
   - Can only access resources explicitly granted
   - Must import functions to interact with environment
   - Host controls all I/O operations

3. **Deterministic Execution**
   - No access to system calls
   - No direct file system access
   - No network access without host permission
   - Predictable, reproducible behavior

#### Browser Sandbox Context

WASM in browsers runs within JavaScript's existing sandbox:

**Shared Sandbox:** WASM and JavaScript share the same security context:
- Same origin policy applies to both
- Same CSP restrictions
- Same cookie/storage access
- Same network permissions

**Implications:**
- WASM inherits JavaScript vulnerabilities
- XSS affecting JavaScript can affect WASM
- Compromised JavaScript can manipulate WASM module imports
- Both subject to browser security updates

#### Inter-Module Communication

**Safe Communication Patterns:**

1. **Typed Imports/Exports**
   ```wasm
   (module
     (import "env" "s3_read" (func $s3_read (param i32 i32) (result i32)))
     (export "process_data" (func $process_data))
   )
   ```

2. **Data Marshalling**
   ```javascript
   const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });

   const importObject = {
     env: {
       memory: memory,
       s3_read: (ptr, len) => {
         const buffer = new Uint8Array(memory.buffer, ptr, len);
         return readFromS3(buffer);
       }
     }
   };
   ```

**Security Considerations:**

- Validate all data passed between JavaScript and WASM
- Sanitize strings before crossing boundary
- Check buffer sizes before copying
- Handle exceptions on both sides

#### Isolation Limitations

**1. JavaScript-WASM Interop Risks**

WASM modules can be manipulated through their JavaScript interface:

```javascript
const wasmModule = await WebAssembly.instantiate(wasmCode, {
  env: {
    malicious_import: () => {
      return sensitiveData;
    }
  }
});
```

**Mitigation:**
- Validate all imported functions
- Use TypeScript for type safety
- Implement capability-based design
- Minimize JavaScript-WASM boundary crossings

**2. Multiple Modules from Different Origins**

Loading WASM modules from multiple origins creates risks:

**Scenario:**
```javascript
const moduleA = await loadWASM('https://trusted.com/module.wasm');
const moduleB = await loadWASM('https://untrusted.com/module.wasm');
```

**Risks:**
- Shared memory between modules
- Side-channel attacks between modules
- Confused deputy attacks

**Mitigation:**
- Load WASM only from trusted origins
- Use CSP to restrict WASM sources
- Implement module integrity checks (Subresource Integrity)
- Isolate untrusted modules in separate workers

#### Runtime Security Features

**1. WebAssembly System Interface (WASI) Capabilities**

For non-browser WASM runtimes:
- Fine-grained capability grants
- Pre-opened directories only
- No ambient file system access
- Network access requires explicit capability

**Not applicable in browsers** (browsers don't implement WASI), but good model for future browser APIs.

**2. Browser Security Mechanisms**

Additional browser protections:
- Site Isolation: Separate processes per origin
- Process sandboxing: OS-level isolation
- Memory protection: ASLR, DEP
- Safe browsing: Malware detection

#### Recommendations for S3 File Explorer

**1. Trust Boundary Design**

```
┌─────────────────────────────────────┐
│         Browser Sandbox             │
│  ┌──────────────────────────────┐   │
│  │   JavaScript Application      │   │
│  │  (Untrusted Input Handling)   │   │
│  └────────────┬─────────────────┘   │
│               │ Validated Data       │
│  ┌────────────▼─────────────────┐   │
│  │      WASM Module              │   │
│  │  (S3 Operations via OpenDAL)  │   │
│  └────────────┬─────────────────┘   │
│               │ Import Functions     │
│  ┌────────────▼─────────────────┐   │
│  │   Controlled S3 Interface     │   │
│  │  (Credential Management)      │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**2. Minimize Privileges**

Only grant WASM module access to:
- Necessary S3 operations
- Required memory buffers
- Essential browser APIs

**3. Input Validation at Boundaries**

```rust
#[no_mangle]
pub extern "C" fn upload_to_s3(
    path_ptr: *const u8,
    path_len: usize,
    data_ptr: *const u8,
    data_len: usize
) -> i32 {
    if path_len > MAX_PATH_LEN || data_len > MAX_FILE_SIZE {
        return -1;
    }

    let path = match validate_utf8(path_ptr, path_len) {
        Ok(p) => p,
        Err(_) => return -1,
    };

    let data = unsafe {
        std::slice::from_raw_parts(data_ptr, data_len)
    };

    upload_internal(path, data)
}
```

### 3.3 Side-Channel Attack Vectors

#### Understanding Side-Channel Attacks

Side-channel attacks exploit information leaked through the physical implementation of a system, rather than theoretical weaknesses in algorithms.

**In WASM Context:**
- Timing variations reveal secret data
- Cache state inference
- Power consumption (less relevant in browsers)
- Electromagnetic emissions (less relevant in browsers)

#### Spectre and Meltdown Vulnerabilities

**Spectre Overview:**

Spectre exploits speculative execution in modern CPUs:
1. CPU predicts branch direction
2. Executes code speculatively
3. If prediction wrong, results discarded architecturally
4. But: Side effects remain (cache state, TLB entries)

**Attack Pattern:**
```javascript
if (index < array.length) {
  let value = array[index];
  let dummy = array2[value * 4096];
}
```

Attacker trains branch predictor, then:
- Provides out-of-bounds index
- CPU speculatively reads out-of-bounds
- Speculatively accesses array2 based on secret value
- Cache timing reveals which array2 element accessed
- Infer secret value

**WASM-Specific Concerns:**

WebAssembly was identified as a potential Spectre attack vector because:

1. **High-Precision Timing**: WASM initially enabled high-precision timers
2. **Shared Memory**: SharedArrayBuffer allows precise timing measurements
3. **Performance Focus**: JIT compilation creates speculative execution opportunities

#### Browser Mitigations

**1. Timer Precision Reduction**

All major browsers reduced timer precision:

```javascript
performance.now()
```

- **Before**: 5μs precision
- **After**: 20μs precision (Firefox), 100μs (Chrome)

**Impact:** Makes timing attacks much harder but not impossible.

**2. SharedArrayBuffer Restrictions**

Initially disabled in all browsers (Jan 2018):

```javascript
new SharedArrayBuffer(1024);
```

**Current Status (2024):**
- Re-enabled with strict requirements
- Requires Cross-Origin Isolation
- Needs COOP and COEP headers
- Desktop only in many browsers

**Required Headers:**
```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**3. Site Isolation**

Chrome's primary defense:
- Each site in separate process
- Limits data accessible via Spectre
- Prevents cross-origin attacks
- Performance overhead acceptable

**4. WebAssembly-Specific Mitigations**

**Threading Support Delayed:**

WebAssembly threading support was paused due to Spectre concerns. The feature is now available but:
- Requires same headers as SharedArrayBuffer
- Limited browser support
- Not available in all contexts

**Code Generation Changes:**

Compilers and WASM runtimes implement mitigations:
- Insert speculation barriers
- Avoid secret-dependent branches
- Use constant-time operations for sensitive code

#### Side-Channel Risks in S3 File Explorer

**1. Credential Leakage**

**Risk:** Timing variations could leak temporary credentials:

```javascript
function checkCredential(input) {
  const correct = getStoredCredential();
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== correct[i]) return false;
  }
  return true;
}
```

**Attack:** Measure time to determine correct credential byte-by-byte.

**Mitigation:**

```javascript
function checkCredential(input) {
  const correct = getStoredCredential();

  if (input.length !== correct.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < input.length; i++) {
    result |= input.charCodeAt(i) ^ correct.charCodeAt(i);
  }
  return result === 0;
}
```

**2. File Content Inference**

**Risk:** Cache timing reveals information about S3 object contents.

**Scenario:**
1. Attacker controls some inputs to WASM module
2. Module processes S3 data
3. Processing time varies based on content
4. Attacker infers sensitive file properties

**Mitigation:**
- Constant-time operations for sensitive comparisons
- Avoid secret-dependent branching
- Add random delays (not ideal but practical)
- Process data in fixed-size chunks

**3. Access Pattern Leakage**

**Risk:** Network timing reveals which S3 objects accessed.

**Mitigation:**
- Batch requests when possible
- Use consistent request patterns
- Implement object prefetching
- Cache frequently accessed objects

#### Recommendations for WASM S3 Application

**1. Avoid High-Precision Timing**

Don't rely on or expose high-precision timers:

```rust
use std::time::Instant;

let start = Instant::now();
sensitive_operation();
let duration = start.elapsed();

duration.as_secs()
```

Use second precision, not nanoseconds.

**2. Constant-Time Cryptographic Operations**

Use libraries designed for constant-time execution:

```rust
use constant_time_eq::constant_time_eq;

fn verify_token(input: &[u8], expected: &[u8]) -> bool {
    constant_time_eq(input, expected)
}
```

**3. Avoid Secret-Dependent Branching**

```rust
fn process_data(data: &[u8], secret: &[u8]) -> Vec<u8> {
    let mut result = Vec::new();

    for (d, s) in data.iter().zip(secret.iter()) {
        result.push(d ^ s);
    }

    result
}
```

**4. Isolate Sensitive Operations**

Perform sensitive operations (credential handling, encryption) outside WASM when possible:

```
JavaScript: Credential Management, Token Refresh
     ↓ (credentials as opaque handles)
WASM: S3 Operations (using handles, not raw credentials)
```

**5. Monitor for Timing Attacks**

Log suspicious patterns:
- Repeated failed authentication attempts
- Unusual request timing patterns
- High-frequency credential checks

**6. Stay Updated**

Monitor security advisories:
- Browser security updates
- WASM runtime vulnerabilities
- OpenDAL security patches
- CPU microcode updates

#### Cross-Origin Isolation for Enhanced Security

If application can use SharedArrayBuffer/threading:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

**Benefits:**
- Higher precision timers available (with user acceptance)
- Better performance
- But: Stronger isolation reduces side-channel risks

**Trade-off:** Evaluate whether threading benefits outweigh complexity and compatibility concerns.

### 3.4 Binary Obfuscation Limitations

#### WASM Binary Format Transparency

WebAssembly binaries are designed to be:
- **Portable**: Work across different platforms
- **Fast to parse**: Quick startup time
- **Verifiable**: Security properties checked before execution
- **Compact**: Smaller than equivalent JavaScript

**Implication:** WASM is NOT designed for code secrecy.

#### Decompilation and Reverse Engineering

**WASM is easily inspectable:**

1. **Text Format Conversion**
   ```bash
   wasm2wat module.wasm -o module.wat
   ```
   Converts binary to human-readable WebAssembly Text Format (WAT).

2. **Decompilers Available**
   - wasm-decompile (from WABT)
   - Ghidra WASM plugin
   - IDA Pro WASM support
   - Online tools (e.g., webassembly.github.io/wabt/demo/)

3. **No Source Map Needed**
   Unlike JavaScript minification, WASM structure is inherently readable.

**Example WAT Output:**
```wat
(module
  (func $upload_to_s3 (param $path i32) (param $data i32) (result i32)
    local.get $path
    local.get $data
    call $opendal_s3_put
  )
  (export "upload_to_s3" (func $upload_to_s3))
)
```

Function names, imports, exports, and control flow visible.

#### What Can Be Extracted

**1. Application Logic**
- Algorithm implementations
- Business rules
- State machines
- Data structures

**2. API Endpoints**
- Imported functions reveal external APIs
- S3 bucket names in string constants
- URL patterns
- API keys (if accidentally embedded)

**3. Constants and Strings**
- Configuration values
- Error messages
- Resource identifiers
- Potentially sensitive data

**4. Credential Patterns**

Even if credentials aren't embedded, patterns reveal:
- Authentication flow
- Credential format expectations
- Token handling logic
- Encryption algorithms used

#### Ineffective Obfuscation Techniques

**1. Name Mangling**

Compilers may generate short/random names:
```wat
(func $a (param $b i32))
```

**Reality:** Function behavior still analyzable. Names reconstructable through analysis.

**2. Control Flow Obfuscation**

Adding fake branches, dead code:

**Problems:**
- Increases binary size
- Hurts performance
- WASM validators may reject complex control flow
- Determined attackers can still analyze

**3. String Encryption**

Encrypting embedded strings:

```rust
const ENCRYPTED_BUCKET: &[u8] = &[0x45, 0x6E, ...];

fn get_bucket_name() -> String {
    decrypt(ENCRYPTED_BUCKET)
}
```

**Problems:**
- Decryption key must be in WASM
- Key extractable through analysis
- Adds runtime overhead
- False sense of security

#### What WASM Obfuscation CANNOT Protect

**1. Credentials**

Never embed in WASM:
- AWS access keys
- Secret tokens
- API keys
- Encryption keys
- Session identifiers

**Reason:** Extractable through binary analysis or runtime inspection.

**2. Proprietary Algorithms**

While obfuscation makes reverse engineering harder:
- Not impossible
- Determined competitors will succeed
- Patent/copyright better protection

**3. Security Through Obscurity**

Relying on attackers not understanding code is NOT security:
- Assume attackers have full source code
- Design security assuming adversary knows implementation
- Use cryptographic security, not obfuscation

#### Effective Security Approaches

**1. Server-Side Secrets**

Keep secrets on server:

```
WASM Client                     Backend Server
     │                               │
     │  Request with HMAC            │
     ├──────────────────────────────>│
     │                               │ Verify HMAC with secret key
     │                               │ Generate temporary credentials
     │  Temporary credentials        │
     │<──────────────────────────────┤
     │                               │
     │  Use credentials for S3       │
     │                               │
```

**2. Cryptographic Security**

Use proper cryptography:
- Public-key authentication
- Challenge-response protocols
- Zero-knowledge proofs (when applicable)
- Signed tokens (JWT with signature verification)

**3. Minimal Client Trust**

Design assuming client is hostile:
- Validate all inputs server-side
- Enforce rate limits
- Implement server-side authorization
- Log and monitor suspicious activity

**4. Code Integrity Verification**

Ensure WASM binary hasn't been tampered with:

```html
<script type="module">
  import init from './s3_explorer.js';

  const response = await fetch('./s3_explorer.wasm');
  const buffer = await response.arrayBuffer();

  const hash = await crypto.subtle.digest('SHA-256', buffer);
  const hashHex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (hashHex !== EXPECTED_HASH) {
    throw new Error('WASM integrity check failed');
  }

  await init();
</script>
```

Or use Subresource Integrity:

```html
<script src="s3_explorer.js"
        integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux..."
        crossorigin="anonymous"></script>
```

#### Recommendations for S3 File Explorer

**1. No Secrets in WASM**

Architecture:
```
WASM Module (Public)
  ↓
Imported Functions (JavaScript)
  ↓
Backend API (Secrets, Credentials)
```

**2. Accept Code Visibility**

Design assuming attackers can read code:
- Use secure protocols
- Implement proper authentication
- Don't rely on algorithm secrecy
- Focus on key secrecy, not algorithm secrecy

**3. Minimize Sensitive Logic**

Keep in WASM only:
- UI logic
- Data transformation
- Local caching
- Performance-critical code

Keep on server:
- Authentication
- Authorization
- Credential generation
- Sensitive business logic

**4. Licensing/IP Protection**

If protecting intellectual property:
- Use legal protections (patents, copyright)
- License agreements
- Commercial obfuscation tools (minimal benefit)
- Server-side execution for critical algorithms

**5. Monitoring and Detection**

Detect unauthorized usage:
- API usage patterns
- Rate limiting
- Geographic restrictions
- User-agent analysis
- Behavioral analysis

## 4. Data Security

### 4.1 Encryption in Transit (TLS/HTTPS)

#### Mandatory HTTPS Requirement

**All communications with S3 must use HTTPS.** This is not optional for secure browser applications.

#### Why TLS/HTTPS is Critical

**1. Confidentiality**
- Prevents eavesdropping on network traffic
- Protects temporary credentials in transit
- Encrypts file contents during upload/download
- Hides S3 object keys and metadata

**2. Integrity**
- Prevents tampering with data in transit
- Detects man-in-the-middle attacks
- Ensures presigned URLs not modified
- Protects against replay attacks (with proper implementation)

**3. Authentication**
- Verifies S3 endpoint identity
- Prevents DNS spoofing attacks
- Ensures connection to legitimate AWS servers

#### Enforcing HTTPS in S3 Bucket Policies

**Deny HTTP Requests:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::bucket-name",
        "arn:aws:s3:::bucket-name/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

**Benefits:**
- Prevents accidental HTTP usage
- Enforces security at infrastructure level
- Complements application-level HTTPS enforcement
- Defense-in-depth principle

#### TLS Version Requirements

**Minimum TLS 1.2:**

Modern browsers and AWS support TLS 1.3, but TLS 1.2 is minimum acceptable:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceTLS12OrHigher",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::bucket-name",
        "arn:aws:s3:::bucket-name/*"
      ],
      "Condition": {
        "NumericLessThan": {
          "s3:TlsVersion": "1.2"
        }
      }
    }
  ]
}
```

**Why:**
- TLS 1.0/1.1 have known vulnerabilities
- Industry standards require TLS 1.2+
- Compliance requirements (PCI DSS, HIPAA)

#### Certificate Validation

**Browser Automatic Validation:**

Browsers automatically validate:
- Certificate authority (CA) chain
- Certificate expiration
- Domain name match
- Revocation status (OCSP, CRL)

**Application Responsibilities:**

1. **Use Official AWS Endpoints**
   ```javascript
   const S3_ENDPOINT = `https://${bucketName}.s3.${region}.amazonaws.com`;
   ```

   Never accept endpoints from untrusted sources.

2. **Verify Certificate Errors**
   ```javascript
   fetch(url)
     .catch(error => {
       if (error.message.includes('certificate')) {
         console.error('TLS certificate validation failed');
         throw new Error('Insecure connection detected');
       }
     });
   ```

3. **No Certificate Bypass**
   Never implement or allow certificate validation bypass in production.

#### HTTPS Enforcement in Application

**1. Content Security Policy**

```http
Content-Security-Policy: upgrade-insecure-requests;
```

Automatically upgrades HTTP to HTTPS.

**2. Strict Transport Security (HSTS)**

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Forces HTTPS for future visits.

**3. Application-Level Checks**

```javascript
if (window.location.protocol !== 'https:') {
  if (window.location.hostname !== 'localhost') {
    window.location.href = 'https:' +
      window.location.href.substring(window.location.protocol.length);
  }
}
```

#### Performance Considerations

**1. TLS Handshake Overhead**

Modern TLS has minimal overhead:
- TLS 1.3: 0-RTT or 1-RTT handshake
- Session resumption
- Connection reuse

**2. Encryption/Decryption**

Hardware-accelerated AES:
- Negligible performance impact
- CPU overhead < 1% typically

**3. Best Practices**

- Reuse connections (HTTP/2, keep-alive)
- Enable compression (gzip, brotli)
- Use CDN/CloudFront for caching
- Implement connection pooling

#### Monitoring and Auditing

**Track TLS Metrics:**

1. **CloudTrail Logging**
   - Records TLS version used
   - Identifies legacy protocol usage
   - Detects anomalies

2. **Application Logging**
   ```javascript
   console.log('S3 request', {
     url: sanitizedUrl,
     protocol: new URL(url).protocol,
     timestamp: Date.now()
   });
   ```

3. **Alerts on HTTP Usage**
   Set up alerts for any HTTP requests to S3 (should never happen).

### 4.2 Client-Side Encryption Options

#### Encryption Architecture Patterns

**1. Client-Side Encryption Before Upload**

```
Browser → Encrypt → Upload to S3 (encrypted data) → Store
Browser ← Decrypt ← Download from S3 (encrypted data) ← Retrieve
```

**Benefits:**
- Data encrypted before leaving browser
- S3 never sees plaintext
- Protection against S3 compromise
- User controls encryption keys

**Challenges:**
- Key management complexity
- Performance overhead
- Browser compatibility
- No server-side search/indexing

**2. Server-Side Encryption (SSE)**

S3 encrypts data at rest:

- **SSE-S3**: S3-managed keys
- **SSE-KMS**: AWS KMS-managed keys
- **SSE-C**: Customer-provided keys

**Note:** Data decrypted during transit to S3. Protects data at rest only.

#### Client-Side Encryption Implementation

**Using Web Crypto API:**

```javascript
async function encryptFile(file, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128
    },
    key,
    await file.arrayBuffer()
  );

  return {
    iv: iv,
    encryptedData: new Uint8Array(encryptedData),
    algorithm: 'AES-GCM'
  };
}

async function decryptFile(encryptedData, iv, key) {
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128
    },
    key,
    encryptedData
  );

  return new Uint8Array(decryptedData);
}
```

**Key Generation:**

```javascript
async function generateEncryptionKey() {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}
```

**Key Derivation from Password:**

```javascript
async function deriveKeyFromPassword(password, salt) {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}
```

#### Key Management Strategies

**1. User-Managed Keys (Maximum Security)**

Users manage their own encryption keys:

**Advantages:**
- Zero-knowledge architecture
- Maximum privacy
- User controls access

**Challenges:**
- Lost key = lost data
- No password recovery
- User education required

**Implementation:**
```javascript
class UserKeyManager {
  async exportKey(key) {
    const exported = await crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exported);
  }

  async importKey(jwkString) {
    const jwk = JSON.parse(jwkString);
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  downloadKey(key) {
    const blob = new Blob([await this.exportKey(key)],
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'encryption-key.json';
    a.click();
  }
}
```

**2. Key Encryption Keys (KEK)**

Wrap data encryption keys with master key:

```javascript
async function wrapDataKey(dataKey, masterKey) {
  const wrappedKey = await crypto.subtle.wrapKey(
    'raw',
    dataKey,
    masterKey,
    {
      name: 'AES-KW'
    }
  );

  return new Uint8Array(wrappedKey);
}

async function unwrapDataKey(wrappedKey, masterKey) {
  return await crypto.subtle.unwrapKey(
    'raw',
    wrappedKey,
    masterKey,
    { name: 'AES-KW' },
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
```

**3. Backend Key Service**

Backend manages keys, browser only uses temporarily:

```javascript
class BackendKeyService {
  async getEncryptionKey(fileId, userToken) {
    const response = await fetch('/api/keys/data-key', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileId })
    });

    const { wrappedKey, iv } = await response.json();

    const unwrappedKey = await this.unwrapKeyInBrowser(wrappedKey, iv);

    return unwrappedKey;
  }

  async unwrapKeyInBrowser(wrappedKey, iv) {
    const browserKey = await this.getBrowserKey();
    return await unwrapDataKey(
      Uint8Array.from(atob(wrappedKey), c => c.charCodeAt(0)),
      browserKey
    );
  }
}
```

**Benefits:**
- Centralized key management
- Key rotation support
- Access control
- Backup/recovery possible

#### Metadata Handling

**Encrypt Sensitive Metadata:**

```javascript
async function encryptMetadata(metadata, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(metadata));

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );

  return {
    encryptedMetadata: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    metadataIv: btoa(String.fromCharCode(...iv))
  };
}
```

**Store as S3 Metadata:**

```javascript
await s3Client.putObject({
  Bucket: bucketName,
  Key: objectKey,
  Body: encryptedFileData,
  Metadata: {
    'x-amz-meta-encrypted-metadata': encryptedMetadata,
    'x-amz-meta-metadata-iv': metadataIv,
    'x-amz-meta-encryption-algorithm': 'AES-GCM'
  }
});
```

#### Performance Optimization

**1. Streaming Encryption**

For large files:

```javascript
async function encryptFileStream(file, key) {
  const CHUNK_SIZE = 64 * 1024;
  const chunks = [];
  const iv = crypto.getRandomValues(new Uint8Array(12));

  for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const data = await chunk.arrayBuffer();

    const encryptedChunk = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );

    chunks.push(new Uint8Array(encryptedChunk));
  }

  return { chunks, iv };
}
```

**2. Web Workers**

Offload encryption to background thread:

```javascript
const worker = new Worker('encryption-worker.js');

worker.postMessage({
  type: 'encrypt',
  file: file,
  key: await exportKey(key)
});

worker.onmessage = (event) => {
  if (event.data.type === 'encrypted') {
    uploadToS3(event.data.encryptedData);
  }
};
```

**encryption-worker.js:**
```javascript
self.onmessage = async (event) => {
  const { type, file, key } = event.data;

  if (type === 'encrypt') {
    const importedKey = await importKey(key);
    const encrypted = await encryptFile(file, importedKey);

    self.postMessage({
      type: 'encrypted',
      encryptedData: encrypted
    });
  }
};
```

#### Security Considerations

**1. Key Storage**

**Never store keys in:**
- localStorage (accessible to XSS)
- sessionStorage (accessible to XSS)
- Cookies (accessible to XSS, transmitted to server)
- JavaScript variables long-term (memory dumps)

**Safer options:**
- IndexedDB with encryption
- Prompt for password on each session
- Hardware security keys (WebAuthn)
- Server-side key management

**2. Forward Secrecy**

Generate new data encryption key per file:

```javascript
async function encryptFileWithNewKey(file) {
  const dataKey = await generateEncryptionKey();
  const encrypted = await encryptFile(file, dataKey);

  const wrappedKey = await wrapDataKey(dataKey, masterKey);

  return {
    encryptedFile: encrypted,
    wrappedKey: wrappedKey
  };
}
```

**Benefits:**
- Compromised key affects one file only
- Supports key rotation
- Enables per-user encryption

**3. Authenticated Encryption**

Always use authenticated encryption (AEAD):
- AES-GCM (recommended)
- ChaCha20-Poly1305

**Never use:**
- AES-CBC without HMAC
- AES-ECB
- Stream ciphers without authentication

#### Compatibility and Fallbacks

**Browser Support Check:**

```javascript
if (!window.crypto || !window.crypto.subtle) {
  throw new Error('Web Crypto API not supported');
}

if (!crypto.subtle.encrypt) {
  throw new Error('Encryption not available');
}
```

**Polyfills:**

For older browsers, consider:
- js-crypto (pure JavaScript implementation)
- But: Performance penalty, security risks

**Recommendation:** Require modern browsers with native Web Crypto API.

### 4.3 Secure File Upload/Download Patterns

#### Upload Security Patterns

**1. Pre-Upload Validation**

Validate files before upload:

```javascript
async function validateAndUploadFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${file.size} bytes`);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type not allowed: ${file.type}`);
  }

  const extension = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(`File extension not allowed: ${extension}`);
  }

  const signature = await getFileSignature(file);
  if (!isValidSignature(signature, file.type)) {
    throw new Error('File signature mismatch');
  }

  return await uploadFile(file);
}
```

**File Signature Validation:**

```javascript
async function getFileSignature(file) {
  const slice = file.slice(0, 512);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

function isValidSignature(signature, expectedType) {
  const signatures = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  };

  const validSigs = signatures[expectedType];
  if (!validSigs) return false;

  return validSigs.some(sig =>
    sig.every((byte, i) => signature[i] === byte)
  );
}
```

**2. Secure Filename Handling**

```javascript
function sanitizeFilename(filename) {
  const basename = filename.replace(/\.[^/.]+$/, '');
  const extension = filename.split('.').pop();

  const sanitized = basename
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200);

  const timestamp = Date.now();
  const random = crypto.getRandomValues(new Uint8Array(8))
    .reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '');

  return `${timestamp}_${random}_${sanitized}.${extension}`;
}
```

**Prevents:**
- Path traversal (../)
- Special characters
- Filename collisions
- Length-based attacks

**3. Multipart Upload for Large Files**

```javascript
async function multipartUpload(file, bucketName, key) {
  const PART_SIZE = 5 * 1024 * 1024;
  const totalParts = Math.ceil(file.size / PART_SIZE);

  const uploadId = await initiateMultipartUpload(bucketName, key);

  const uploadedParts = [];

  for (let i = 0; i < totalParts; i++) {
    const start = i * PART_SIZE;
    const end = Math.min(start + PART_SIZE, file.size);
    const part = file.slice(start, end);

    const partNumber = i + 1;
    const etag = await uploadPart(
      bucketName,
      key,
      uploadId,
      partNumber,
      part
    );

    uploadedParts.push({ PartNumber: partNumber, ETag: etag });
  }

  await completeMultipartUpload(bucketName, key, uploadId, uploadedParts);
}
```

**Benefits:**
- Resume interrupted uploads
- Upload large files efficiently
- Parallel part uploads
- Better error recovery

**4. Upload Progress and Cancellation**

```javascript
class UploadManager {
  constructor() {
    this.activeUploads = new Map();
  }

  async uploadWithProgress(file, onProgress) {
    const uploadId = crypto.randomUUID();
    const controller = new AbortController();

    this.activeUploads.set(uploadId, controller);

    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      });

      return { success: true, uploadId };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      throw error;
    } finally {
      this.activeUploads.delete(uploadId);
    }
  }

  cancelUpload(uploadId) {
    const controller = this.activeUploads.get(uploadId);
    if (controller) {
      controller.abort();
    }
  }
}
```

**5. Upload Verification**

Verify upload integrity:

```javascript
async function uploadWithVerification(file, bucketName, key) {
  const expectedHash = await calculateHash(file);

  await s3Client.putObject({
    Bucket: bucketName,
    Key: key,
    Body: file,
    Metadata: {
      'x-amz-meta-client-hash': expectedHash
    }
  });

  const headResponse = await s3Client.headObject({
    Bucket: bucketName,
    Key: key
  });

  if (headResponse.ETag.replace(/"/g, '') !== expectedHash) {
    await s3Client.deleteObject({ Bucket: bucketName, Key: key });
    throw new Error('Upload verification failed');
  }
}

async function calculateHash(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

#### Download Security Patterns

**1. Content-Type Validation**

```javascript
async function downloadFile(url, expectedType) {
  const response = await fetch(url);

  const contentType = response.headers.get('Content-Type');
  if (!contentType || !contentType.startsWith(expectedType)) {
    throw new Error(`Unexpected content type: ${contentType}`);
  }

  const contentDisposition = response.headers.get('Content-Disposition');
  if (!contentDisposition || !contentDisposition.includes('attachment')) {
    console.warn('Missing or incorrect Content-Disposition header');
  }

  return await response.blob();
}
```

**2. Size Validation**

```javascript
async function downloadWithSizeCheck(url, maxSize) {
  const response = await fetch(url);

  const contentLength = response.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength) > maxSize) {
    throw new Error('File too large');
  }

  const reader = response.body.getReader();
  const chunks = [];
  let receivedLength = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    if (receivedLength > maxSize) {
      throw new Error('File size exceeded during download');
    }
  }

  return new Blob(chunks);
}
```

**3. Download Verification**

```javascript
async function downloadAndVerify(url, expectedHash) {
  const response = await fetch(url);
  const blob = await response.blob();

  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (actualHash !== expectedHash) {
    throw new Error('Download integrity check failed');
  }

  return blob;
}
```

**4. Secure Blob URL Handling**

```javascript
class SecureBlobManager {
  constructor() {
    this.activeBlobUrls = new Set();
  }

  createBlobUrl(blob) {
    const url = URL.createObjectURL(blob);
    this.activeBlobUrls.add(url);
    return url;
  }

  revokeBlobUrl(url) {
    if (this.activeBlobUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.activeBlobUrls.delete(url);
    }
  }

  revokeAllBlobUrls() {
    this.activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
    this.activeBlobUrls.clear();
  }

  downloadFile(blob, filename) {
    const url = this.createBlobUrl(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    setTimeout(() => this.revokeBlobUrl(url), 1000);
  }
}
```

**Memory Management:**
- Revoke blob URLs when no longer needed
- Prevents memory leaks
- Cleanup on page unload

**5. Streaming Downloads**

```javascript
async function streamDownload(url, onProgress) {
  const response = await fetch(url);
  const contentLength = response.headers.get('Content-Length');

  const reader = response.body.getReader();
  const chunks = [];
  let receivedLength = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    if (contentLength) {
      const progress = (receivedLength / parseInt(contentLength)) * 100;
      onProgress(progress);
    }
  }

  return new Blob(chunks);
}
```

#### Rate Limiting and Throttling

**Client-Side Rate Limiting:**

```javascript
class RateLimiter {
  constructor(maxRequests, timeWindowMs) {
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMs;
    this.requests = [];
  }

  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(
      time => now - time < this.timeWindowMs
    );

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.throttle();
    }

    this.requests.push(now);
  }
}

const uploadLimiter = new RateLimiter(10, 60000);

async function rateLimitedUpload(file) {
  await uploadLimiter.throttle();
  return await uploadFile(file);
}
```

#### Error Handling and Retry Logic

```javascript
async function uploadWithRetry(file, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFile(file);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      if (isRetryable(error)) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
}

function isRetryable(error) {
  const retryableErrors = [
    'NetworkError',
    'TimeoutError',
    'ServiceUnavailable',
    'InternalError',
    'RequestTimeout'
  ];

  return retryableErrors.some(type =>
    error.message.includes(type) || error.name === type
  );
}
```

### 4.4 Content Security Policy (CSP) Configuration

#### CSP Fundamentals for S3 Applications

Content Security Policy is a critical browser security mechanism that restricts resources the page can load and execute.

#### Comprehensive CSP for S3 File Explorer

```http
Content-Security-Policy:
  default-src 'self';
  connect-src 'self' https://*.s3.*.amazonaws.com https://cognito-idp.*.amazonaws.com;
  script-src 'self' 'wasm-unsafe-eval';
  worker-src 'self' blob:;
  img-src 'self' https://*.s3.*.amazonaws.com data: blob:;
  media-src 'self' https://*.s3.*.amazonaws.com blob:;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
  block-all-mixed-content;
```

#### Directive Explanations

**1. default-src 'self'**

Fallback for directives not explicitly set. Only allow resources from same origin.

**2. connect-src**

Controls XHR, fetch, WebSocket connections:

```
connect-src 'self' https://*.s3.*.amazonaws.com https://cognito-idp.*.amazonaws.com
```

**Allows:**
- Same-origin API calls
- S3 bucket access (any region)
- Cognito authentication endpoints

**Important:** Must include all S3 regions your application uses. Wildcard `*.s3.*.amazonaws.com` covers all regions.

**3. script-src 'self' 'wasm-unsafe-eval'**

**'wasm-unsafe-eval'** required for WebAssembly instantiation:

```javascript
WebAssembly.instantiate(wasmCode);
```

Without this, WASM compilation fails.

**Note:** Despite "unsafe" in name, 'wasm-unsafe-eval' is safe for WASM. It does NOT allow `eval()` or `new Function()`.

**4. worker-src 'self' blob:**

For Web Workers and background processing:

```javascript
const worker = new Worker('/encryption-worker.js');

const blob = new Blob([workerCode], { type: 'application/javascript' });
const blobWorker = new Worker(URL.createObjectURL(blob));
```

**5. img-src, media-src**

Allow loading images/media from S3:

```
img-src 'self' https://*.s3.*.amazonaws.com data: blob:
media-src 'self' https://*.s3.*.amazonaws.com blob:
```

**Includes:**
- data: URLs for inline images
- blob: URLs for dynamically created content

**6. style-src 'self' 'unsafe-inline'**

**Note:** 'unsafe-inline' reduces security but often necessary for:
- Inline styles
- CSS-in-JS libraries
- Dynamic styling

**Better Alternative (if possible):**
```
style-src 'self' 'nonce-{random}'
```

Then use nonce on inline styles:
```html
<style nonce="{random}">...</style>
```

**7. object-src 'none'**

Disable plugins (Flash, Java applets):
- Legacy technology
- Security risk
- Not needed for modern applications

**8. frame-ancestors 'none'**

Prevent page from being embedded in iframes:
- Clickjacking protection
- If embedding needed: `frame-ancestors https://trusted-site.com`

**9. upgrade-insecure-requests**

Automatically upgrade HTTP to HTTPS:
- Prevents mixed content errors
- Enforces encryption

**10. block-all-mixed-content**

Block HTTP resources on HTTPS pages:
- Stronger than upgrade-insecure-requests
- Blocks instead of upgrading

#### CSP Implementation Methods

**1. HTTP Header (Recommended)**

Set via web server:

**Nginx:**
```nginx
add_header Content-Security-Policy "default-src 'self'; ...";
```

**Apache:**
```apache
Header set Content-Security-Policy "default-src 'self'; ..."
```

**CloudFront Response Headers Policy:**
```json
{
  "ResponseHeadersPolicyConfig": {
    "Name": "S3ExplorerSecurityHeaders",
    "SecurityHeadersConfig": {
      "ContentSecurityPolicy": {
        "ContentSecurityPolicy": "default-src 'self'; ...",
        "Override": true
      }
    }
  }
}
```

**2. Meta Tag (Fallback)**

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; ...">
```

**Limitations:**
- Cannot use frame-ancestors
- Cannot use report-uri
- Less secure (can be removed by XSS before processing)

#### CSP Reporting

Monitor CSP violations:

```http
Content-Security-Policy-Report-Only:
  default-src 'self';
  report-uri https://your-domain.com/csp-report;
  report-to csp-endpoint;
```

**Report endpoint:**
```javascript
app.post('/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  console.log('CSP Violation:', req.body);

  logToMonitoring({
    type: 'csp-violation',
    documentUri: req.body['document-uri'],
    violatedDirective: req.body['violated-directive'],
    blockedUri: req.body['blocked-uri'],
    timestamp: Date.now()
  });

  res.status(204).end();
});
```

**Report-Only Mode:**

Test CSP without enforcing:
- Use Content-Security-Policy-Report-Only header
- Monitor violations
- Fix issues before enforcing

#### Common CSP Challenges

**1. S3 Bucket URLs**

Different URL formats:

```
https://bucket-name.s3.amazonaws.com
https://bucket-name.s3.region.amazonaws.com
https://s3.region.amazonaws.com/bucket-name
```

**Solution:** Use wildcard covering all formats or specify exact format used.

**2. CloudFront Integration**

If using CloudFront in front of S3:

```
connect-src 'self' https://d123456abcdef.cloudfront.net
img-src 'self' https://d123456abcdef.cloudfront.net
```

**3. Third-Party Libraries**

Libraries loading external resources break CSP.

**Solutions:**
- Self-host dependencies
- Use CSP-compatible libraries
- Add trusted sources to CSP

**4. Inline Event Handlers**

```html
<button onclick="handleClick()">Click</button>
```

Blocked by CSP (unless 'unsafe-inline').

**Solution:** Use event listeners:
```javascript
document.querySelector('button').addEventListener('click', handleClick);
```

#### S3-Specific CSP Configuration

**For S3 Static Website Hosting:**

S3 static hosting doesn't support custom headers. Use:

1. **CloudFront + Lambda@Edge:**

```javascript
exports.handler = async (event) => {
  const response = event.Records[0].cf.response;
  const headers = response.headers;

  headers['content-security-policy'] = [{
    key: 'Content-Security-Policy',
    value: "default-src 'self'; connect-src 'self' https://*.s3.*.amazonaws.com; ..."
  }];

  return response;
};
```

2. **CloudFront Response Headers Policy (Easier):**

Create policy in CloudFront console with CSP configuration.

#### Testing CSP

**1. Browser DevTools**

Check Console for CSP violations:
```
Refused to load the script 'https://untrusted.com/script.js' because it violates the following Content Security Policy directive: "script-src 'self'".
```

**2. CSP Evaluator**

Use Google's CSP Evaluator: https://csp-evaluator.withgoogle.com/

**3. Automated Testing**

```javascript
describe('CSP', () => {
  it('should have correct CSP header', async () => {
    const response = await fetch('/');
    const csp = response.headers.get('Content-Security-Policy');

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('wasm-unsafe-eval');
    expect(csp).toContain('https://*.s3.*.amazonaws.com');
  });
});
```

#### Progressive Enhancement

Start strict, relax as needed:

```http
Content-Security-Policy:
  default-src 'none';
  script-src 'self' 'wasm-unsafe-eval';
  connect-src 'self' https://*.s3.*.amazonaws.com;
```

Add directives only when features require them. This minimizes attack surface.

## 5. Access Control Patterns

### 5.1 IAM Policy Best Practices

#### Principle of Least Privilege

**Core Concept:** Grant only permissions required to perform specific tasks, nothing more.

#### IAM Policy Structure for S3 File Explorer

**1. Separate Policies by Function**

**Read-Only Access:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowListBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    },
    {
      "Sid": "AllowReadObjects",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

**Upload Access:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowUploadObjects",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/uploads/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

**Delete Access (Minimal Grant):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDeleteOwnObjects",
      "Effect": "Allow",
      "Action": "s3:DeleteObject",
      "Resource": "arn:aws:s3:::your-bucket-name/users/${cognito-identity.amazonaws.com:sub}/*"
    }
  ]
}
```

#### Condition-Based Access Control

**1. Enforce Encryption:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyUnencryptedUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

**2. IP-Based Restrictions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowFromOfficeOnly",
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": [
            "203.0.113.0/24",
            "198.51.100.0/24"
          ]
        }
      }
    }
  ]
}
```

**3. Time-Based Access:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDuringBusinessHours",
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "DateGreaterThan": {
          "aws:CurrentTime": "2024-01-01T09:00:00Z"
        },
        "DateLessThan": {
          "aws:CurrentTime": "2024-12-31T17:00:00Z"
        }
      }
    }
  ]
}
```

**4. MFA Required:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RequireMFAForDelete",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:DeleteObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
```

#### User-Specific Access with Cognito

**Directory-Based Isolation:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowUserSpecificAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/users/${cognito-identity.amazonaws.com:sub}/*"
    },
    {
      "Sid": "AllowListUserDirectory",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::your-bucket-name",
      "Condition": {
        "StringLike": {
          "s3:prefix": "users/${cognito-identity.amazonaws.com:sub}/*"
        }
      }
    }
  ]
}
```

**Variable Substitution:**
- `${cognito-identity.amazonaws.com:sub}`: Unique user identifier
- `${aws:username}`: IAM user name
- `${aws:userid}`: IAM user ID

#### Policy Validation and Testing

**1. IAM Policy Simulator:**

```bash
aws iam simulate-custom-policy \
  --policy-input-list file://policy.json \
  --action-names s3:GetObject s3:PutObject \
  --resource-arns arn:aws:s3:::your-bucket-name/file.txt
```

**2. Access Analyzer:**

```bash
aws accessanalyzer create-analyzer \
  --analyzer-name s3-explorer-analyzer \
  --type ACCOUNT

aws accessanalyzer list-findings \
  --analyzer-arn arn:aws:access-analyzer:region:account:analyzer/s3-explorer-analyzer
```

**3. Policy Generation from CloudTrail:**

IAM Access Analyzer can generate policies based on actual usage:

```bash
aws accessanalyzer start-policy-generation \
  --policy-generation-details '{
    "principalArn": "arn:aws:iam::account:role/S3ExplorerRole",
    "cloudTrailDetails": {
      "startTime": "2024-01-01T00:00:00Z",
      "endTime": "2024-01-31T23:59:59Z",
      "trails": [{"trailArn": "arn:aws:cloudtrail:region:account:trail/name"}]
    }
  }'
```

#### Common Policy Mistakes

**1. Overly Permissive Wildcards:**

```json
{
  "Action": "s3:*",
  "Resource": "*"
}
```

**Problem:** Grants access to ALL S3 buckets and ALL actions.

**Fix:** Specify exact buckets and required actions.

**2. Missing Resource ARN:**

```json
{
  "Action": "s3:PutObject",
  "Resource": "arn:aws:s3:::bucket-name"
}
```

**Problem:** Bucket ARN vs. Object ARN. PutObject requires object ARN.

**Fix:**
```json
"Resource": "arn:aws:s3:::bucket-name/*"
```

**3. Implicit Deny:**

```json
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::bucket/public/*"
}
```

Without ListBucket, user can get objects but can't list them. Need both.

**4. Conflicting Policies:**

Explicit Deny always wins. Check for denies in:
- IAM policies
- Bucket policies
- Service Control Policies (SCPs)
- Session policies

### 5.2 Bucket Policies for Web Access

#### Public vs. Private Access Patterns

**1. Completely Private Bucket:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyAllPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ],
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalAccount": "YOUR_AWS_ACCOUNT_ID"
        }
      }
    }
  ]
}
```

**Plus:** Enable S3 Block Public Access at bucket level.

**2. Public Read, Authenticated Write:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadAccess",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/public/*"
    },
    {
      "Sid": "AuthenticatedWrite",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/CognitoRole"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::your-bucket-name/uploads/*"
    }
  ]
}
```

**3. Conditional Public Access:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadWithRefererCheck",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringLike": {
          "aws:Referer": "https://your-domain.com/*"
        }
      }
    }
  ]
}
```

**Note:** Referer can be spoofed. Not strong security, but prevents hotlinking.

#### CORS-Enabled Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCORSRequests",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/WebAppRole"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Sid": "AllowCORSPreflight",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringEquals": {
          "s3:ExistingObjectTag/public": "true"
        }
      }
    }
  ]
}
```

**Combined with CORS configuration:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

#### Defense in Depth Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "DenyUnencryptedObjectUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    },
    {
      "Sid": "DenyOldTLSVersions",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ],
      "Condition": {
        "NumericLessThan": {
          "s3:TlsVersion": "1.2"
        }
      }
    },
    {
      "Sid": "AllowAuthenticatedAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/S3ExplorerRole"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

**Layers:**
1. Deny insecure transport
2. Deny unencrypted uploads
3. Deny old TLS versions
4. Allow authenticated access

#### CloudFront with S3 Origin

**Origin Access Identity (OAI) Pattern:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    },
    {
      "Sid": "DenyDirectS3Access",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringNotEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

**Benefits:**
- Users cannot bypass CloudFront
- All requests go through CDN
- Centralized access logging
- Caching benefits

#### Logging and Monitoring

**Enable S3 Access Logging:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ServerAccessLogsPolicy",
      "Effect": "Allow",
      "Principal": {
        "Service": "logging.s3.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::your-logs-bucket/logs/*",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "ACCOUNT_ID"
        }
      }
    }
  ]
}
```

**CloudTrail Data Events:**

```bash
aws cloudtrail put-event-selectors \
  --trail-name your-trail \
  --event-selectors '[{
    "ReadWriteType": "All",
    "IncludeManagementEvents": true,
    "DataResources": [{
      "Type": "AWS::S3::Object",
      "Values": ["arn:aws:s3:::your-bucket-name/*"]
    }]
  }]'
```

### 5.3 Principle of Least Privilege

#### Implementation Strategy

**1. Start with Zero Access**

Begin with deny-all, add only required permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*"
    }
  ]
}
```

Then add specific allows.

**2. Iterative Permission Granting**

**Process:**
1. Grant minimal permissions
2. Test functionality
3. Review CloudTrail for AccessDenied errors
4. Add only denied permissions that are necessary
5. Repeat until functionality works

**Example Workflow:**

**Initial Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

**Test:** User tries to upload.

**CloudTrail shows:** AccessDenied for s3:PutObject.

**Update Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::your-bucket-name"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/uploads/*"
    }
  ]
}
```

**3. Action-Level Granularity**

Be specific with actions:

**Too Broad:**
```json
"Action": "s3:*"
```

**Appropriate:**
```json
"Action": [
  "s3:GetObject",
  "s3:GetObjectVersion",
  "s3:ListBucket",
  "s3:ListBucketVersions"
]
```

**4. Resource-Level Restrictions**

Limit to specific resources:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOnlyPublicContent",
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/public/*"
    },
    {
      "Sid": "FullAccessUserContent",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/users/${cognito-identity.amazonaws.com:sub}/*"
    }
  ]
}
```

#### Role Separation

**1. Separate Roles by Function**

**Viewer Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

**Uploader Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/uploads/*"
      ]
    }
  ]
}
```

**Administrator Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketPolicy"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

**2. Time-Bound Elevated Access**

Use short-duration credentials for sensitive operations:

```javascript
async function assumeDeleteRole() {
  const params = {
    RoleArn: 'arn:aws:iam::ACCOUNT_ID:role/S3DeleteRole',
    RoleSessionName: `delete-session-${Date.now()}`,
    DurationSeconds: 900
  };

  const { Credentials } = await sts.assumeRole(params).promise();

  return {
    accessKeyId: Credentials.AccessKeyId,
    secretAccessKey: Credentials.SecretAccessKey,
    sessionToken: Credentials.SessionToken,
    expiration: Credentials.Expiration
  };
}
```

**Session duration: 15 minutes** for sensitive operations.

#### Monitoring Least Privilege Compliance

**1. IAM Access Advisor**

Shows last accessed services/actions:

```bash
aws iam generate-service-last-accessed-details \
  --arn arn:aws:iam::ACCOUNT_ID:role/S3ExplorerRole
```

Review unused permissions quarterly.

**2. CloudTrail Analysis**

Identify actually used permissions:

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::S3::Object \
  --max-results 50
```

**3. Access Analyzer Policy Validation**

```bash
aws accessanalyzer validate-policy \
  --policy-document file://policy.json \
  --policy-type IDENTITY_POLICY
```

Identifies overly permissive policies.

#### Regular Permission Reviews

**Quarterly Review Process:**

1. **List all roles:**
   ```bash
   aws iam list-roles --query 'Roles[?contains(RoleName, `S3Explorer`)]'
   ```

2. **Review attached policies:**
   ```bash
   aws iam list-attached-role-policies --role-name S3ExplorerRole
   ```

3. **Check last accessed:**
   ```bash
   aws iam generate-service-last-accessed-details --arn ROLE_ARN
   ```

4. **Remove unused permissions**

5. **Update documentation**

### 5.4 Session Management Strategies

#### Session Lifecycle Management

**1. Session Initialization**

```javascript
class SessionManager {
  constructor() {
    this.sessionId = null;
    this.credentials = null;
    this.expiration = null;
    this.refreshTimer = null;
  }

  async initialize(userToken) {
    this.sessionId = crypto.randomUUID();

    const identityId = await this.getIdentityId(userToken);

    this.credentials = await this.getCredentials(identityId);
    this.expiration = this.credentials.expiration;

    this.scheduleRefresh();

    this.logSessionStart();
  }

  async getIdentityId(userToken) {
    const params = {
      IdentityPoolId: IDENTITY_POOL_ID,
      Logins: {
        [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: userToken
      }
    };

    const { IdentityId } = await cognitoIdentity.getId(params).promise();
    return IdentityId;
  }

  async getCredentials(identityId) {
    const params = {
      IdentityId: identityId
    };

    const result = await cognitoIdentity.getCredentialsForIdentity(params).promise();

    return {
      accessKeyId: result.Credentials.AccessKeyId,
      secretAccessKey: result.Credentials.SecretAccessKey,
      sessionToken: result.Credentials.SessionToken,
      expiration: new Date(result.Credentials.Expiration)
    };
  }
}
```

**2. Proactive Session Refresh**

```javascript
class SessionManager {
  scheduleRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const timeUntilExpiration = this.expiration - Date.now();
    const refreshTime = timeUntilExpiration - (5 * 60 * 1000);

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshSession();
      }, refreshTime);
    }
  }

  async refreshSession() {
    try {
      const userToken = await this.getCurrentUserToken();
      const identityId = await this.getIdentityId(userToken);

      this.credentials = await this.getCredentials(identityId);
      this.expiration = this.credentials.expiration;

      this.scheduleRefresh();

      this.notifyCredentialsRefreshed();
    } catch (error) {
      console.error('Session refresh failed:', error);
      this.handleSessionExpiration();
    }
  }
}
```

**3. Session Termination**

```javascript
class SessionManager {
  async terminate() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.credentials = null;
    this.expiration = null;

    await this.logSessionEnd();

    this.clearCachedData();

    this.notifySessionTerminated();
  }

  clearCachedData() {
    sessionStorage.clear();

    indexedDB.deleteDatabase('s3-explorer-cache');
  }
}
```

#### Inactivity Timeout

```javascript
class InactivityMonitor {
  constructor(timeoutMs = 30 * 60 * 1000) {
    this.timeoutMs = timeoutMs;
    this.lastActivityTime = Date.now();
    this.inactivityTimer = null;
    this.onTimeout = null;

    this.setupActivityListeners();
    this.startMonitoring();
  }

  setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        this.recordActivity();
      }, { passive: true });
    });
  }

  recordActivity() {
    this.lastActivityTime = Date.now();
    this.resetTimer();
  }

  startMonitoring() {
    this.resetTimer();
  }

  resetTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      this.handleInactivity();
    }, this.timeoutMs);
  }

  handleInactivity() {
    console.log('User inactive, terminating session');
    if (this.onTimeout) {
      this.onTimeout();
    }
  }
}

const inactivityMonitor = new InactivityMonitor(30 * 60 * 1000);
inactivityMonitor.onTimeout = () => {
  sessionManager.terminate();
  window.location.href = '/login?reason=inactivity';
};
```

#### Concurrent Session Management

```javascript
class ConcurrentSessionDetector {
  constructor() {
    this.sessionKey = 's3-explorer-active-session';
    this.checkInterval = null;
  }

  initialize() {
    const currentSessionId = crypto.randomUUID();
    localStorage.setItem(this.sessionKey, JSON.stringify({
      sessionId: currentSessionId,
      timestamp: Date.now()
    }));

    this.startMonitoring(currentSessionId);

    window.addEventListener('beforeunload', () => {
      this.cleanup(currentSessionId);
    });
  }

  startMonitoring(currentSessionId) {
    this.checkInterval = setInterval(() => {
      const stored = JSON.parse(localStorage.getItem(this.sessionKey));

      if (stored && stored.sessionId !== currentSessionId) {
        this.handleConcurrentSession();
      }
    }, 5000);
  }

  handleConcurrentSession() {
    clearInterval(this.checkInterval);

    alert('This account is being used in another tab/window. This session will be terminated.');

    sessionManager.terminate();
    window.location.href = '/login?reason=concurrent';
  }

  cleanup(sessionId) {
    const stored = JSON.parse(localStorage.getItem(this.sessionKey));
    if (stored && stored.sessionId === sessionId) {
      localStorage.removeItem(this.sessionKey);
    }
  }
}
```

#### Session Security Headers

```javascript
async function createSecureSession() {
  const sessionData = {
    sessionId: crypto.randomUUID(),
    created: Date.now(),
    userAgent: navigator.userAgent,
    ipHash: await hashIP(clientIP)
  };

  const signature = await signSessionData(sessionData);

  return {
    ...sessionData,
    signature
  };
}

async function validateSession(sessionData) {
  const currentUserAgent = navigator.userAgent;
  if (sessionData.userAgent !== currentUserAgent) {
    throw new Error('User agent mismatch');
  }

  const currentIPHash = await hashIP(clientIP);
  if (sessionData.ipHash !== currentIPHash) {
    console.warn('IP address changed');
  }

  const isValidSignature = await verifySignature(
    sessionData,
    sessionData.signature
  );

  if (!isValidSignature) {
    throw new Error('Invalid session signature');
  }

  const age = Date.now() - sessionData.created;
  if (age > MAX_SESSION_AGE) {
    throw new Error('Session too old');
  }
}
```

#### Audit Logging

```javascript
class SessionAuditor {
  async logSessionEvent(eventType, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId: sessionManager.sessionId,
      eventType: eventType,
      userId: await this.getUserId(),
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      details: details
    };

    await this.sendToAuditLog(logEntry);
  }

  async logSessionStart() {
    await this.logSessionEvent('SESSION_START', {
      authMethod: 'cognito',
      identityPoolId: IDENTITY_POOL_ID
    });
  }

  async logSessionRefresh() {
    await this.logSessionEvent('SESSION_REFRESH', {
      previousExpiration: sessionManager.expiration,
      newExpiration: sessionManager.credentials.expiration
    });
  }

  async logSessionEnd(reason) {
    await this.logSessionEvent('SESSION_END', {
      reason: reason,
      duration: Date.now() - sessionManager.sessionStartTime
    });
  }

  async logAccessDenied(resource, action) {
    await this.logSessionEvent('ACCESS_DENIED', {
      resource: resource,
      action: action
    });
  }

  async sendToAuditLog(logEntry) {
    await fetch('/api/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    });
  }
}
```

## Recommendations Summary

### Critical Security Requirements

1. **Never embed AWS credentials in browser code**
2. **Always use HTTPS/TLS 1.2+**
3. **Implement strict CSP**
4. **Use temporary credentials (Cognito + STS)**
5. **Apply principle of least privilege**
6. **Enable comprehensive logging and monitoring**

### Architecture Recommendations

**Recommended Stack:**

```
Browser (WASM + JavaScript)
    ↓
Amazon Cognito (Authentication)
    ↓
Cognito Identity Pool (AWS Credentials)
    ↓
Amazon S3 (Data Storage)
```

**Security Layers:**

1. **Transport Security**: TLS 1.2+, HTTPS enforcement
2. **Authentication**: Cognito User Pools
3. **Authorization**: IAM policies, bucket policies
4. **Application Security**: CSP, WASM sandboxing
5. **Data Security**: Encryption at rest and in transit
6. **Monitoring**: CloudTrail, Access Analyzer, application logs

### OpenDAL-Specific Considerations

1. **Credential Configuration**: Explicitly configure credentials; disable environment loading
2. **Error Handling**: Don't expose sensitive information in error messages
3. **Memory Management**: Leverage Rust's safety features; review unsafe blocks
4. **Token Protection**: Recent fix for Azure shows importance of credential protection in WASM context

### Regular Security Practices

**Weekly:**
- Review access logs for anomalies
- Monitor failed authentication attempts

**Monthly:**
- Review IAM policies for unused permissions
- Update dependencies (OpenDAL, WASM tooling)
- Test credential rotation

**Quarterly:**
- Conduct security audit
- Review and update CSP
- Penetration testing
- Access control review

**Annually:**
- Comprehensive security assessment
- Disaster recovery testing
- Incident response plan review

### Compliance Considerations

For regulated industries:

- **GDPR**: Implement data deletion, user consent
- **HIPAA**: Enable encryption, audit logging, access controls
- **PCI DSS**: Secure credential management, network segmentation
- **SOC 2**: Comprehensive logging, access reviews

### Emergency Response

**Credential Compromise:**
1. Immediately revoke credentials
2. Review CloudTrail for unauthorized access
3. Rotate all credentials
4. Notify affected users
5. Conduct post-incident review

**Data Breach:**
1. Isolate affected systems
2. Preserve evidence
3. Notify stakeholders per legal requirements
4. Conduct forensic analysis
5. Implement remediation

### Future Considerations

**Emerging Technologies:**

- **WebAuthn**: Hardware-based authentication for enhanced security
- **Privacy Sandbox**: Chrome's privacy-preserving APIs
- **WASM Component Model**: Better isolation between components
- **Trusted Execution Environments**: Hardware-based security for sensitive operations

**Ongoing Threats:**

- Monitor for new Spectre/Meltdown variants
- Stay updated on WASM security research
- Track browser security updates
- Follow AWS security bulletins

---

**Last Updated:** 2025-10-22

**References:**
- AWS S3 Security Best Practices: https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html
- WebAssembly Security: https://webassembly.org/docs/security/
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- AWS IAM Best Practices: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
