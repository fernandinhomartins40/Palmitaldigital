interface PostMediaGalleryProps {
  media: Array<{
    id: string;
    url: string;
    type?: string;
    mimeType?: string | null;
  }>;
}

function MediaTile({
  item,
  className,
}: {
  item: PostMediaGalleryProps['media'][number];
  className: string;
}) {
  const isVideo = item.type === 'VIDEO' || item.mimeType?.startsWith('video/');

  if (isVideo) {
    return (
      <video
        src={item.url}
        controls
        playsInline
        preload="metadata"
        className={className}
      />
    );
  }

  return <img src={item.url} alt="" className={className} />;
}

export function PostMediaGallery({ media }: PostMediaGalleryProps) {
  if (!media.length) {
    return null;
  }

  const [featured, ...thumbnails] = media;

  return (
    <div className="mt-3 space-y-2">
      <MediaTile
        item={featured}
        className="max-h-[32rem] w-full rounded-2xl object-cover"
      />

      {thumbnails.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {thumbnails.map((item) => (
            <MediaTile
              key={item.id}
              item={item}
              className="aspect-square w-full rounded-xl object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
