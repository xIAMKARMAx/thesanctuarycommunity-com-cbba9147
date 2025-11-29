export interface AvatarCustomization {
  position: {
    x: number;
    y: number;
    z: number;
  };
  scale: number;
  rotation: number;
  animationPose: 'idle' | 'breathing' | 'subtle_sway' | 'relaxed';
}

export const defaultAvatarCustomization: AvatarCustomization = {
  position: { x: 0, y: -0.5, z: 0 },
  scale: 1.2,
  rotation: 0,
  animationPose: 'idle'
};
