interface AIRoomSceneProps {
  roomImageUrl: string;
  avatarImageUrl?: string;
  petImageUrl?: string;
  petName?: string;
}

export function AIRoomScene({ roomImageUrl, avatarImageUrl, petImageUrl }: AIRoomSceneProps) {
  // Show the most composited image: pet > avatar > room
  // Because each generation composites INTO the previous scene
  const displayUrl = petImageUrl || avatarImageUrl || roomImageUrl;

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-background relative">
      <img
        src={displayUrl}
        alt="AI Room Scene"
        className="w-full h-full object-cover"
        crossOrigin="anonymous"
      />
    </div>
  );
}
