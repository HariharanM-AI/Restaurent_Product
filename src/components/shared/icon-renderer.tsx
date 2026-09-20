import React from "react";
import * as LucideIcons from "lucide-react";
import { LucideProps } from "lucide-react";

interface IconRendererProps extends LucideProps {
  name: string;
}

export function IconRenderer({ name, ...props }: IconRendererProps) {
  // Normalize PascalCase or kebab-case
  const iconName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("") as keyof typeof LucideIcons;

  const IconComponent = (LucideIcons[iconName] as React.ComponentType<LucideProps>) || LucideIcons.Sparkles;

  return <IconComponent {...props} />;
}
