import { BaseNode } from '@voiceflow/base-types';
import { HandlerFactory } from '@voiceflow/general-runtime/build/runtime';

const VALID_INTEGRATIONS = new Set([
  BaseNode.Utils.IntegrationType.ZAPIER,
  BaseNode.Utils.IntegrationType.GOOGLE_SHEETS,
]);

const IntegrationsHandler: HandlerFactory<BaseNode.Integration.Node> = () => ({
  canHandle: (node) =>
    node.type === BaseNode.NodeType.INTEGRATIONS && VALID_INTEGRATIONS.has(node.selected_integration),
  handle: (node) => {
    return node.fail_id ?? node.success_id ?? null;
  },
});

export default IntegrationsHandler;
