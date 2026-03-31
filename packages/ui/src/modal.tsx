"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@repo/ui/utils";

const Modal = ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; }) => {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30" />
                <Dialog.Content
                    className={cn(
                        "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-6 shadow-lg",
                        "w-[90vw] max-w-md"
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
