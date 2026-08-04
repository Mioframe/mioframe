export type OrdinaryBranchArtifactServerHandle = {
  url: string;
  close: () => Promise<void>;
};

export declare function buildAndServeOrdinaryBranchArtifact(options: {
  channelId: string;
}): Promise<OrdinaryBranchArtifactServerHandle>;
