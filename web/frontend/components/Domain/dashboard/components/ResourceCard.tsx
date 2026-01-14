import {
  InlineStack,
  BlockStack,
  Text,
  Icon,
  Box,
} from "@shopify/polaris";
import type { IconSource } from "@shopify/polaris";

type IconTone = "base" | "magic" | "info" | "success" | "warning" | "critical" | "emphasis";

// Map icon tones to CSS color classes for text
const getToneColorStyle = (tone: IconTone): React.CSSProperties => {
  const colorMap: Record<IconTone, string> = {
    base: "var(--p-color-text)",
    magic: "var(--p-color-text-magic)",
    info: "var(--p-color-text-info)",
    success: "var(--p-color-text-success)",
    warning: "var(--p-color-text-caution)",
    critical: "var(--p-color-text-critical)",
    emphasis: "var(--p-color-text-emphasis)",
  };
  
  return { color: colorMap[tone] };
};

// Map icon tones to light background colors
const getToneBackgroundColor = (tone: IconTone): string => {
  const backgroundMap: Record<IconTone, string> = {
    base: "rgba(0, 128, 96, 0.08)", // light green
    magic: "rgba(128, 81, 255, 0.08)", // light purple
    info: "rgba(0, 148, 213, 0.08)", // light blue
    success: "rgba(0, 128, 96, 0.08)", // light green
    warning: "rgba(255, 184, 0, 0.08)", // light yellow
    critical: "rgba(239, 77, 47, 0.08)", // light red
    emphasis: "rgba(0, 91, 211, 0.08)", // light blue
  };
  
  return backgroundMap[tone];
};

type Props = {
  icon: IconSource;
  iconTone?: IconTone;
  title: string;
  description: string;
};

export function ResourceCard({ 
  icon, 
  iconTone = "base", 
  title, 
  description 
}: Props) {
  return (
    <div
      style={{
        backgroundColor: getToneBackgroundColor(iconTone),
        borderRadius: "var(--p-border-radius-300)",
        border: "var(--p-border-width-025) solid var(--p-color-border-secondary)",
      }}
    >
      <Box padding="400">
        <InlineStack gap="400" blockAlign="start" wrap={false}>
          <Box
            background="bg-surface"
            padding="300"
            borderRadius="200"
            minWidth="fit-content"
          >
            <Icon source={icon} tone={iconTone} />
          </Box>

          <BlockStack gap="200">
            <span style={getToneColorStyle(iconTone)}>
              <Text as="h3" variant="headingSm" fontWeight="semibold">
                {title}
              </Text>
            </span>
            <Text as="p" variant="bodyMd" tone="subdued">
              {description}
            </Text>
          </BlockStack>
        </InlineStack>
      </Box>
    </div>
  );
}