export const cardColors = ["green", "blue", "purple"];

export function getCardStyle(color: string) {
  const commonStyles =
    "text-white border-b-8 hover:brightness-105 transition-all duration-200 ease-in-out";
  switch (color) {
    case "green":
      return `bg-duo-green border-[var(--duo-green-dark)] ${commonStyles}`;
    case "blue":
      return `bg-duo-blue border-[var(--duo-blue-dark)] ${commonStyles}`;
    case "purple":
      return `bg-duo-purple border-[var(--duo-purple-dark)] ${commonStyles}`;
    default:
      return commonStyles;
  }
} 