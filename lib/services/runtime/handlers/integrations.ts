import { BaseNode } from '@voiceflow/base-types';
import {
  HandlerFactory,
  IntegrationsHandler as GeneralRuntimeIntegrationsHandler,
} from '@voiceflow/general-runtime/build/runtime';

import log from '@/logger';

export interface IntegrationsOptions {
  integrationsEndpoint: string;
}

const VALID_INTEGRATIONS = new Set([
  BaseNode.Utils.IntegrationType.ZAPIER,
  BaseNode.Utils.IntegrationType.GOOGLE_SHEETS,
]);

const IntegrationsHandler: HandlerFactory<BaseNode.Integration.Node, IntegrationsOptions> = ({
  integrationsEndpoint,
}) => ({
  canHandle: (node) =>
    node.type === BaseNode.NodeType.INTEGRATIONS && VALID_INTEGRATIONS.has(node.selected_integration),
  handle: (node, runtime, variables, programs) => {
    if (node.selected_action && node.selected_integration) {
      log.warn(
        log.vars({
          integration: node.selected_integration,
          action: node.selected_action,
          versionID: runtime?.getVersionID?.(),
          projectID: runtime?.project?._id,
        })
      );
    }

    return GeneralRuntimeIntegrationsHandler({ integrationsEndpoint }).handle(node, runtime, variables, programs);
  },
});

export default IntegrationsHandler;
