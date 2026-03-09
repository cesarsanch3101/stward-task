"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useComments, useCreateComment } from "@/lib/hooks/use-comments";

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

export function CommentSection({ taskId }: Props) {
  const { data: comments, isLoading } = useComments(taskId);
  const createComment = useCreateComment(taskId);
  const [content, setContent] = useState("");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al comentario más reciente cuando carga o llega uno nuevo
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments?.length]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || createComment.isPending) return;
    createComment.mutate(trimmed, {
      onSuccess: () => setContent(""),
    });
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
        <Button
          type="button"
          size="sm"
          disabled={!content.trim() || createComment.isPending}
          className="self-end"
          onClick={handleSend}
        >
          {createComment.isPending ? "..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}
