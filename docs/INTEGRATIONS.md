# Integration status

- Browser geolocation: permission-based, on explicit request; manual city/ZIP entry remains available. The bundled centroid list is limited and must be expanded before a real launch.
- Google Maps: keyless links for real directory listings. No route-time, Places, map embed or paid Maps API integration is configured.
- Google Sheets: read-only service-account adapter and worker; credentials and a real authorized spreadsheet are required. Adapter fixtures pass, but no live account has been verified.
- CSV/XLSX: local snapshot parsing and mapping; changes to a local original do not sync automatically.
- Messaging: in-app case updates and staff notification records exist. SMS/email delivery and delivery-status webhooks are not implemented; no external messages are sent.
- AI: deterministic species extraction only; no AI provider is connected.
- Storage: an early private local filesystem attachment adapter exists in the pilot branch. It requires a configured private directory; malware scanning and object storage are not implemented or verified for production.
- ezyVet, Vetspire, other PIMS, Microsoft 365, telephony and billing: not connected. Vendor and clinic authorization, documented scopes, sandbox testing and explicit agreements are required before implementation or production use.
