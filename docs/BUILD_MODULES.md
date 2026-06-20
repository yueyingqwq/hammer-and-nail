# Build Modules Reference

> **Auto-generated** from the module definitions in [`build.py`](../build.py). Last generated: 2026-06-20.

## Module Table

| Module | Language | Directory | Build Command | Clean Command | Build Artifacts |
|--------|----------|-----------|--------------|---------------|-----------------|
| `backend` | Rust | `backend` | `cargo build` | `cargo clean` | `backend/target` |
| `frontend` | TypeScript | `frontend` | `npm run build` | `rm -rf node_modules dist` | `frontend/dist` |
| `market` | Go | `market` | `go build -o market .` | `rm -f market` | `market/market` |
| `frailbox` | C | `frailbox` | `make` | `make distclean` | `frailbox/frailbox` |
| `engine` | C++ | `frailbox/engine` | `cmake --build build` | `rm -rf build` | `frailbox/engine/build/trial-engine` |
| `compliance` | Java | `compliance` | `javac -d build ComplianceAuditor.java` | `rm -rf build` | `compliance/build` |
| `v2-market-stream` | Ruby | `v2/services` | `ruby -c market_stream.rb` | `echo Ruby has no build artifacts to clean` | `—` |
| `nfc-scanner` | Lua | `frailbox/nfc` | `luac -p scanner.lua` | `echo Lua has no build artifacts to clean` | `—` |
| `openapi-haskell` | Haskell | `docs/openapi` | `ghc -fno-code Types.hs Server.hs Validate.hs Generate.hs` | `rm -f *.hi *.o *.hie` | `—` |
| `openapi-tools` | Lua | `tools` | `luac -p openapi_diff.lua openapi_mock.lua openapi_pact.lua` | `echo Nothing to clean` | `—` |

## Usage

### Build all

```bash
python3 build.py
```

### Select specific modules

```bash
python3 build.py -m backend              # Backend only
python3 build.py -m frontend,market      # Frontend and market
```

### Clean artifacts

```bash
python3 build.py --clean                 # All modules
python3 build.py --clean -m backend      # Backend only
```

### Release mode

```bash
python3 build.py --release               # Rust backend release
```

### Verbose output

```bash
python3 build.py --verbose
```

### List available modules

```bash
python3 build.py --list
```
