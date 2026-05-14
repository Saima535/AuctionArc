"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import styles from "./ListingImageGallery.module.css";

export function ListingImageGallery({
  images = [],
  title = "Listing image",
  fallback = "L",
  fallbackClassName = "",
}) {
  const validImages = useMemo(
    () => images.filter(Boolean),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const imageCount = validImages.length;
  const activeImage = validImages[activeIndex] || "";

  function move(direction) {
    setActiveIndex((current) => {
      const next = current + direction;

      if (next < 0) {
        return imageCount - 1;
      }

      if (next >= imageCount) {
        return 0;
      }

      return next;
    });
  }

  return (
    <div className={styles.gallery}>
      {activeImage ? (
        <div className={styles.slide}>
          <Image
            src={activeImage}
            alt={`${title} photo ${activeIndex + 1}`}
            fill
            unoptimized
          />
        </div>
      ) : (
        <div className={`${styles.fallback} ${fallbackClassName}`.trim()}>
          <span>{fallback}</span>
        </div>
      )}

      {imageCount > 1 ? (
        <>
          <div className={styles.dots}>
            {validImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ""}`.trim()}
                aria-label={`Show photo ${index + 1}`}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>

          <div className={styles.controls}>
            <span className={styles.count}>{activeIndex + 1}/{imageCount}</span>
            <button
              type="button"
              className={styles.navButton}
              aria-label="Previous photo"
              onClick={() => move(-1)}
            >
              {"<"}
            </button>
            <button
              type="button"
              className={styles.navButton}
              aria-label="Next photo"
              onClick={() => move(1)}
            >
              {">"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
