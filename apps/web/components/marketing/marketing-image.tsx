import { cn } from "@repo/ui/utils";

type MarketingImageProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

/** Static public images — native img avoids Next optimizer issues in dev/monorepo. */
export function MarketingImage({
  src,
  alt,
  className,
  priority = false,
}: MarketingImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local /public assets; reliable without sharp
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
    />
  );
}
