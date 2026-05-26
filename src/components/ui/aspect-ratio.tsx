import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

function AspectRatio({ children, ...props }: Props) {
  return <div {...props}>{children}</div>;
}

export { AspectRatio };
