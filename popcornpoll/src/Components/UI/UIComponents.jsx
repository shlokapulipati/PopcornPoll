import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";
import { Button as ShadcnButton } from "@/components/ui/button";

export const Skeleton = ({ className, type = "text" }) => {
  let extraClasses = "";
  if (type === "title") extraClasses = "h-8 w-3/4 mb-4";
  if (type === "text") extraClasses = "h-4 w-full mb-2";
  if (type === "avatar") extraClasses = "h-12 w-12 rounded-full";
  if (type === "card") extraClasses = "h-48 w-full rounded-xl";
  if (type === "movie-poster") extraClasses = "aspect-[2/3] w-full rounded-lg";
  return <ShadcnSkeleton className={`${extraClasses} ${className || ""}`} />;
};

export const Modal = ({ isOpen, onClose, title, children }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export const Button = ({ 
  children, 
  variant = "primary", 
  onClick, 
  disabled = false, 
  className = "", 
  type = "button" 
}) => {
  let shadcnVariant = "default";
  if (variant === "secondary") shadcnVariant = "secondary";
  if (variant === "danger") shadcnVariant = "destructive";
  if (variant === "outline") shadcnVariant = "outline";
  if (variant === "ghost") shadcnVariant = "ghost";

  return (
    <ShadcnButton
      type={type}
      variant={shadcnVariant}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </ShadcnButton>
  );
};
