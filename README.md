# Local Network Monitor

A comprehensive local network security and inventory console, featuring real-time device discovery, dynamic network-change detection, and a cybersecurity-styled dashboard.

## Overview and Features
- **Real-time Discovery**: Continuously monitors the local subnet for active devices.
- **Dynamic Network Awareness**: Automatically detects interface, IP, subnet, and SSID changes, resetting discovery for the new network boundary to prevent stale inventory leaks.
- **Intelligent Naming System**: Extracts the best possible readable names for devices based on mDNS metadata, OUI manufacturer lookups, hostname parsing, and device type heuristics, falling back safely to generated identifiers when necessary.
- **User Aliases**: Allows assigning stable, locally-saved custom names (e.g., "Koushik Laptop") to specific MAC addresses.
- **Cybersecurity UI**: A dark, terminal-inspired interface (React/Vite) showing real-time scanning progress, device groupings, sorting, and live health metrics.
- **Privacy-First**: Operates 100% locally. The backend explicitly binds to `127.0.0.1` and does not contact external MAC lookup APIs, telemetry servers, or cloud databases.

## Architecture
- **Frontend**: React + Vite application (`frontend/`). Handles layout, local storage aliases, filtering, sorting, and UI interactions. Connects to the backend via REST API and WebSockets.
- **Backend**: Node.js + Express + WebSocket service (`backend/`). Acts as the discovery engine wrapping native Linux networking tools to fetch and aggregate device data securely.

## Requirements
- **Fedora / Linux Environment** (relying on Linux-native tools).
- Node.js (v18+ recommended)
- Standard networking utilities (typically pre-installed or easily available via `dnf`):
  - `iproute` (`ip route`, `ip neigh`)
  - `avahi-tools` (`avahi-browse`)
  - `NetworkManager` (`nmcli`)
  - (Optional) `nmap` for safe fallback discovery

## Installation & Running

### 1. Backend Server
Navigate to the `backend` directory, install dependencies, and start the node service.
```bash
cd backend
npm install
node server.js
```
*The backend binds explicitly to `http://127.0.0.1:8787`.*

### 2. Frontend Application
Navigate to the `frontend` directory, install dependencies, and start the Vite dev server.
```bash
cd frontend
npm install
npm run dev
```
*Access the dashboard at `http://localhost:5173`.*

## Endpoints
- **REST API** (http://127.0.0.1:8787):
  - `GET /api/health` - Check backend service health
  - `GET /api/network` - Retrieve current active network boundaries (SSID, IP, Gateway, Interface)
  - `GET /api/devices` - Fetch the full current local device inventory
  - `POST /api/scan` - Trigger a manual discovery scan on the current subnet
- **WebSocket** (ws://127.0.0.1:8787):
  - Emits real-time events for device additions, updates, network transitions, and scanning lifecycle states.

## Discovery Methods & Details
- **Local ARP / Neighbor Cache**: Uses `ip neigh` to passively map local IPv4 and MAC pairings.
- **mDNS / Avahi**: Extracts descriptive names and service signatures (AirPlay, nearby-presence, etc.) using `avahi-browse`.
- **Manufacturer Details**: Utilizes internal OUI mapping for MAC vendor identification.

## Device Naming and Aliasing
The system uses a strict fallback priority to assign meaningful display names:
1. User-defined Aliases (stored safely in frontend `localStorage`).
2. Explicit mDNS product/device names.
3. Cleaned hostnames.
4. Manufacturer + Device Type groupings.
5. Genuinely Unidentified devices (e.g. `Unidentified Device 01`).

## Limitations
- **Client Isolation**: If the campus or public Wi-Fi network uses AP/Client isolation, peer devices will not be visible to ARP broadcasts.
- **Proxy ARP**: Devices routed transparently (e.g., VPN gateways) may reflect the router's MAC for multiple IPs. The monitor tags these as `Proxy-ARP` and excludes them from normal device counts.
- **Randomized MACs**: Modern mobile operating systems use randomized MAC addresses, limiting OUI manufacturer identification and tracking across different networks.
- **Incomplete Hostnames**: Depending on DHCP behaviors and network size, reverse DNS names might not resolve fully for all devices.

## Local-Only Privacy & Security
The backend listens **exclusively on the loopback interface (`127.0.0.1`)**, ensuring that neighboring devices on the Wi-Fi network cannot query your discovery instance or exploit the REST/WebSocket endpoints. No metrics, local inventory data, MAC addresses, or IP ranges are transmitted off the machine.
