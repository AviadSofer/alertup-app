import { Text, Thumbnail } from "@shopify/polaris";
import type { TableData } from "@shopify/polaris";
import { EMPTY_VARIANT_TITLE } from "app/constants";

interface TableRowProcessorProps {
  rows: TableData[][];
  imageColumnIndex?: number;
  variantColumnIndex?: number;
  titleColumnIndex: number;
}

const variantTagStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2px 8px",
  backgroundColor: "rgb(241, 241, 241)",
  borderRadius: "3px",
  fontSize: "12px",
  lineHeight: "16px",
  marginTop: "4px",
  width: "fit-content",
};

const placeholderStyle = {
  height: "24px",
};

const defaultImageSvg = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="4" fill="#F6F6F7"/>
  <path d="M28 12H12C10.9 12 10 12.9 10 14V26C10 27.1 10.9 28 12 28H28C29.1 28 30 27.1 30 26V14C30 12.9 29.1 12 28 12ZM28 26H12V14H28V26Z" fill="#38B2AC"/>
  <path d="M16 20H24V22H16V20Z" fill="#F6AD55"/>
  <path d="M16 16H24V18H16V16Z" fill="#F6AD55"/>
</svg>`;

export function processRows({
  rows,
  imageColumnIndex,
  variantColumnIndex,
  titleColumnIndex,
}: TableRowProcessorProps): TableData[][] {
  return rows.map((row) => {
    const newRow = [...row];

    if (imageColumnIndex !== undefined) {
      const imageUrl = row[imageColumnIndex];
      if (imageUrl) {
        newRow[imageColumnIndex] = (
          <Thumbnail source={imageUrl as string} alt="" size="small" />
        );
      } else {
        newRow[imageColumnIndex] = (
          <Thumbnail
            source={`data:image/svg+xml;utf8,${encodeURIComponent(defaultImageSvg)}`}
            alt=""
            size="small"
          />
        );
      }
    }

    if (variantColumnIndex !== undefined) {
      const variantText = row[variantColumnIndex];
      const showVariant = variantText && variantText !== EMPTY_VARIANT_TITLE;

      newRow[titleColumnIndex] = (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text as="span" variant="headingSm">
            {row[titleColumnIndex]}
          </Text>
          {showVariant ? (
            <div style={variantTagStyle}>{variantText}</div>
          ) : (
            <div style={placeholderStyle} />
          )}
        </div>
      );
      newRow.splice(variantColumnIndex, 1);
    }

    return newRow;
  });
}
