import {
  createUploadthing,
  type FileRouter,
  UploadThingError,
} from "uploadthing/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createDocument } from "@/modules/documents";

const f = createUploadthing();

function inferDocType(file: { name: string; type: string }) {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  if (name.includes("contract")) return "CONTRACT";
  if (
    name.includes("id") ||
    name.includes("passport") ||
    name.includes("cin")
  ) {
    return "ID_CARD";
  }
  if (name.includes("cert")) return "CERTIFICATE";
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "PDF";
  return "OTHER";
}

export const uploadRouter = {
  // Employee documents: contracts, ID cards, certificates, etc.
  documentUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(
      z.object({
        title: z.string().min(1).max(200).optional(),
        type: z.string().min(1).max(50).optional(),
      }),
    )
    .middleware(async ({ req, input }) => {
      const session = await auth.api.getSession({ headers: req.headers });

      if (!session?.user) {
        throw new UploadThingError("Unauthorized — please sign in to upload");
      }

      return {
        userId: session.user.id,
        title: input.title,
        type: input.type,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const title = metadata.title?.trim() || file.name;
      const type = metadata.type?.trim() || inferDocType(file);
      const fileUrl = file.ufsUrl;

      const saved = await createDocument({
        userId: metadata.userId,
        title,
        fileUrl,
        type,
      });

      console.log(
        `Document saved: id=${saved.id} userId=${metadata.userId} url=${fileUrl}`,
      );

      return {
        uploadedBy: metadata.userId,
        documentId: saved.id,
        fileUrl,
        title: saved.title,
        type: saved.type,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
