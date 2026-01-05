import React from "react";

{/* <div className="flex justify-center items-center flex-wrap mt-10">
  <Horizontal3Columns
    lists={[
      shuffleArray(LIST_CARD_LINK),
      shuffleArray(LIST_CARD_LINK),
      shuffleArray(LIST_CARD_LINK),
    ]}
    itemWidth={180}
    itemHeight={240}
    gap={12}
    middleOffsetY={100} // cột giữa lệch lên 20px
    subtleOffset={5} // các item lệch ±2.5px
  />
</div>; */}

type Horizontal3ColumnsProps = {
  lists: string[][]; // mảng 3 mảng ảnh
  itemWidth?: number;
  itemHeight?: number;
  gap?: number; // khoảng cách giữa các cột và giữa các item
  middleOffsetY?: number; // offset cho cột giữa
  subtleOffset?: number; // lệch nhỏ ngẫu nhiên cho từng item
};

const Horizontal3Columns: React.FC<Horizontal3ColumnsProps> = ({
  lists,
  itemWidth = 180,
  itemHeight = 240,
  gap = 16,
  middleOffsetY = 20,
  subtleOffset = 5,
}) => {
  return (
    <div className="flex justify-center p-4" style={{ gap }}>
      {lists.map((images, colIndex) => {
        const isMiddle = colIndex === 1; // cột giữa
        return (
          <div
            key={colIndex}
            className="flex flex-col items-center"
            style={{
              gap,
              transform: isMiddle ? `translateY(-${middleOffsetY}px)` : "none",
            }}
          >
            {images.map((src, i) => {
              const offsetX = (Math.random() - 0.5) * subtleOffset;
              const offsetY = (Math.random() - 0.5) * subtleOffset;
              return (
                <div
                  key={i}
                  className="rounded-lg shadow-lg overflow-hidden"
                  style={{
                    width: itemWidth,
                    height: itemHeight,
                    transform: `translate(${offsetX}px, ${offsetY}px)`,
                  }}
                >
                  <img
                    src={src}
                    alt={`img-${colIndex}-${i}`}
                    draggable={false}
                    className="w-full h-full object-cover"
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default Horizontal3Columns;
