import { useState, useRef, useEffect } from "react";
import { Copy, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface LineLinkModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  linkUrl: string;
  studentName: string;
}

export function LineLinkModal({
  isOpen,
  onOpenChange,
  linkUrl,
  studentName,
}: LineLinkModalProps) {
  const { t } = useTranslation(["students"]);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      toast.success(t("students:line.modal.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("students:line.copyFailed"));
    }
  };

  const handleSelectAll = () => {
    inputRef.current?.select();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("students:line.modal.title")}</DialogTitle>
          <DialogDescription>
            {t("students:line.modal.description", { name: studentName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            ref={inputRef}
            readOnly
            value={linkUrl}
            onClick={handleSelectAll}
            className="font-mono text-xs cursor-text"
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleCopy}
            rightIcon={copied ? CheckCircle2 : Copy}
          >
            {copied
              ? t("students:line.modal.copied")
              : t("students:line.modal.copyButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
