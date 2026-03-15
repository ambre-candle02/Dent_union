# DentUnion API & Source Configuration

## Active Professional Keys (Phase 1+):
- **NewsData.io API Key**: `pub_11ccc59aed8b4c58bdd89cd6d8286e2f` (Global Headlines aggregator)
- **RSS2JSON API Key**: `qmsfgi1veiedlxio3jqifg4hg2pyinvlice7geib` (Official Organization Feed converter)
- **GNews.io API Key**: `33b834bdb3196ebaa8ec9941b32a07ac` (Google-indexed Peer-reviewed News focus)


## Central Config Location:
Keys are also stored in `/config/keys.json` for easy management.

## Integration:
The system uses a hybrid engine in `utils/rss.ts` to combine raw RSS feeds with professional News APIs for 100% uptime and authenticity.

