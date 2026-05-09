import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Global Sonner toaster — luxury glass styling with design tokens.
 * App code should call `notify.*` from `@/lib/notify` instead of `toast` directly.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      duration={4200}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/60 group-[.toaster]:backdrop-blur-xl group-[.toaster]:shadow-[0_8px_32px_hsl(240_50%_1%/0.7)] group-[.toaster]:rounded-2xl",
          title: "group-[.toast]:font-semibold group-[.toast]:text-foreground",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl",
          success: "group-[.toaster]:border-primary/40",
          error: "group-[.toaster]:border-destructive/50",
          info: "group-[.toaster]:border-secondary/40",
          warning: "group-[.toaster]:border-accent/40",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
