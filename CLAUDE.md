@AGENTS.md

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, run `graphify query "<question>"` first to get a scoped subgraph
- Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain are insufficient
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
