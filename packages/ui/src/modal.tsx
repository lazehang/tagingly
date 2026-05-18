"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@repo/ui/utils";

const Modal = ({
  open,
  onOpenChange,
  children,
  contentClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  contentClassName?: string;
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg",
            "w-[90vw] max-w-md focus:outline-none",
            contentClassName
          )}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

const ModalTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    return (
        <Dialog.Title
            className={cn("text-lg font-semibold text-foreground", className)}
            {...props}
        />
    );
};

const ModalDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
    return (
        <Dialog.Description
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    );
};

export { Modal, ModalTitle, ModalDescription };
