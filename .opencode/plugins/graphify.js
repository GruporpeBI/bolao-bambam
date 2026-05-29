// graphify OpenCode plugin
// Injects a knowledge graph reminder before bash tool calls when the graph exists.
import { existsSync } from "fs";
import { join } from "path";

export const GraphifyPlugin = async ({ directory }) => {
  let reminded = false;

  return {
    "tool.execute.before": async (input, output) => {
      if (reminded) return;
      if (!existsSync(join(directory, "graphify-out", "graph.json"))) return;

      if (input.tool === "bash") {
        output.args.command =
          'echo "[graphify] Knowledge graph available at graphify-out/. For focused questions, run graphify query \"<question>\" first (scoped subgraph). Use graphify path \"<A>\" \"<B>\" and graphify explain \"<concept>\" as needed. Read GRAPH_REPORT.md only for broad architecture review." && ' +
          output.args.command;
        reminded = true;
      }
    },
  };
};
