"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Paperclip, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useComments, useCreateComment, useCreateCommentWithFile } from "@/lib/hooks/use-comments";

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  taskId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CommentSection({ taskId }: Props) {
  const { data: comments, isLoading } = useComments(taskId);
  const createComment = useCreateComment(taskId);
  const createCommentWithFile = useCreateCommentWithFile(taskId);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al comentario más reciente cuando carga o llega uno nuevo
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments?.length]);

  const isPending = createComment.isPending || createCommentWithFile.isPending;

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || isPending) return;

    if (selectedFile) {
      createCommentWithFile.mutate(
        { content: trimmed, file: selectedFile },
        {
          onSuccess: () => {
            setContent("");
            setSelectedFile(null);
          },
        }
      );
    } else {
      createComment.mutate(trimmed, {
        onSuccess: () => setContent(""),
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        Comentarios
        {comments && comments.length > 0 && (
          <span className="text-xs font-normal bg-muted px-1.5 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </h4>

      <div>
        {isLoading ? (
          <p className="text-xs text-muted-foreground py-2">Cargando...</p>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-2.5">
            <p className="text-[10px] text-muted-foreground text-center pb-1 border-b border-border/30">
              Inicio del historial
            </p>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-md border bg-muted/30 px-3 py-2"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {comment.source === "email" ? (
                    <Mail className="h-3 w-3 text-amber-500" />
                  ) : (
                    <User className="h-3 w-3 text-blue-500" />
                  )}
                  <span className="text-xs font-medium">
                    {comment.author
                      ? `${comment.author.first_name} ${comment.author.last_name}`.trim() || comment.author.email
                      : comment.author_email}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {formatDateTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-xs text-foreground whitespace-pre-wrap">
                  {comment.content}
                </p>
                {comment.attachment_filename && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                    <Paperclip className="h-3 w-3 shrink-0" />
                    <span className="font-medium">{comment.attachment_filename}</span>
                    {comment.attachment_size != null && (
                      <span>· {formatFileSize(comment.attachment_size)}</span>
                    )}
                    <span className="text-amber-600">· enviado por correo</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            Sin comentarios aún
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {selectedFile && (
          <div className="flex items-center gap-1.5 rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground">
            <Paperclip className="h-3 w-3 shrink-0 text-amber-500" />
            <span className="flex-1 truncate font-medium">{selectedFile.name}</span>
            <span>{formatFileSize(selectedFile.size)}</span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="ml-1 hover:text-destructive"
              aria-label="Quitar archivo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
            }}
            placeholder="Escribe un comentario... (Ctrl+Enter para enviar)"
            rows={2}
            className="text-xs resize-none"
          />
          <div className="flex flex-col gap-1 self-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              title="Adjuntar archivo (máx. 10 MB)"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!content.trim() || isPending}
              onClick={handleSend}
            >
              {isPending ? "..." : "Enviar"}
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          aria-label="Adjuntar archivo al comentario"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f && f.size > 10 * 1024 * 1024) {
              alert("El archivo no puede superar los 10 MB.");
              e.target.value = "";
              return;
            }
            setSelectedFile(f);
            e.target.value = "";
          }}
        />
        <p className="text-[10px] text-muted-foreground">
          El adjunto se enviará por correo — no se almacena en la app (máx. 10 MB)
        </p>
      </div>
    </div>
  );
}
