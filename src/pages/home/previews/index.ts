import { Component, lazy } from "solid-js"
import { getIframePreviews, me, getSettingBool } from "~/store"
import { Obj, ObjType, UserMethods, UserPermissions } from "~/types"
import { ext } from "~/utils"
import { generateIframePreview } from "./iframe"
import { useRouter } from "~/hooks"
import { isArchive } from "~/store/archive"

type Ext = string[] | "*" | ((name: string) => boolean)
type Prior = boolean | (() => boolean)

const extsContains = (exts: Ext | undefined, name: string): boolean => {
  if (exts === undefined) {
    return false
  } else if (exts === "*") {
    return true
  } else if (typeof exts === "function") {
    return (exts as (name: string) => boolean)(name)
  } else {
    return (exts as string[]).includes(ext(name).toLowerCase())
  }
}

const isPrior = (p: Prior): boolean => {
  if (typeof p === "boolean") {
    return p
  }
  return p()
}

export interface Preview {
  name: string
  type?: ObjType
  exts?: Ext
  provider?: RegExp
  component: Component
  prior: Prior
}

export type PreviewComponent = Pick<Preview, "name" | "component">

const previews: Preview[] = [
  {
    name: t("files.html"),
    exts: ["html"],
    component: lazy(() => import("./html")),
    prior: true,
  },
  {
    name: t("files.aliyun_video"),
    type: ObjType.VIDEO,
    provider: /^Aliyundrive(Open)?$/,
    component: lazy(() => import("./aliyun_video")),
    prior: true,
  },
  {
    name: t("files.markdown"),
    type: ObjType.TEXT,
    component: lazy(() => import("./markdown")),
    prior: true,
  },
  {
    name: t("files.markdown_with_word_wrap"),
    type: ObjType.TEXT,
    component: lazy(() => import("./markdown_with_word_wrap")),
    prior: true,
  },
  {
    name: t("files.url"),
    exts: ["url"],
    component: lazy(() => import("./url")),
    prior: true,
  },
  {
    name: t("files.text-editor"),
    type: ObjType.TEXT,
    exts: ["url"],
    component: lazy(() => import("./text-editor")),
    prior: true,
  },
  {
    name: t("files.image"),
    type: ObjType.IMAGE,
    component: lazy(() => import("./image")),
    prior: true,
  },
  {
    name: t("files.video"),
    type: ObjType.VIDEO,
    component: lazy(() => import("./video")),
    prior: true,
  },
  {
    name: t("files.audio"),
    type: ObjType.AUDIO,
    component: lazy(() => import("./audio")),
    prior: true,
  },
  {
    name: t("files.ipa"),
    exts: ["ipa", "tipa"],
    component: lazy(() => import("./ipa")),
    prior: true,
  },
  {
    name: t("files.plist"),
    exts: ["plist"],
    component: lazy(() => import("./plist")),
    prior: true,
  },
  {
    name: t("files.heic"),
    exts: ["heic", "heif", "avif", "vvc", "avc", "jpeg", "jpg"],
    component: lazy(() => import("./heic")),
    prior: true,
  },
  {
    name: t("files.aliyun_office"),
    exts: ["doc", "docx", "ppt", "pptx", "xls", "xlsx", "pdf"],
    provider: /^Aliyundrive(Share)?$/,
    component: lazy(() => import("./aliyun_office")),
    prior: true,
  },
  {
    name: t("files.pdf"),
    exts: ["pdf"],
    component: lazy(() => import("./pdf")),
    prior: true,
  },
  {
    name: t("files.asciinema"),
    exts: ["cast"],
    component: lazy(() => import("./asciinema")),
    prior: true,
  },
  {
    name: t("files.archive"),
    exts: (name: string) => {
      const index = UserPermissions.findIndex(
        (item) => item === "read_archives",
      )
      if (!UserMethods.can(me(), index)) return false
      return isArchive(name)
    },
    component: lazy(() => import("./archive")),
    prior: () => getSettingBool("preview_archives_by_default"),
  },
]

export const getPreviews = (
  file: Obj & { provider: string },
): PreviewComponent[] => {
  const { searchParams } = useRouter()
  const typeOverride =
    ObjType[searchParams["type"]?.toUpperCase() as keyof typeof ObjType]
  const res: PreviewComponent[] = []
  const subsequent: PreviewComponent[] = []
  // internal previews
  previews.forEach((preview) => {
    if (preview.provider && !preview.provider.test(file.provider)) {
      return
    }
    if (
      preview.type === file.type ||
      (typeOverride && preview.type === typeOverride) ||
      extsContains(preview.exts, file.name)
    ) {
      const r = { name: preview.name, component: preview.component }
      if (isPrior(preview.prior)) {
        res.push(r)
      } else {
        subsequent.push(r)
      }
    }
  })
  // iframe previews
  const iframePreviews = getIframePreviews(file.name)
  res.push(
    ...iframePreviews.map((preview) => ({
      name: preview.key,
      component: generateIframePreview(preview.value),
    })),
  )

  // download page
  const downloadComponent: PreviewComponent = {
    name: t("files.download"),
    component: lazy(() => import("./download")),
  }

  // Condition for the new requirement: a large text file.
  const isLargeTextFile =
    file.type === ObjType.TEXT && file.size >= 1 * 1024 * 1024

  // Conditions from the previous logic for small, unrecognized files.
  const noPreviewsFound = res.length === 0 && subsequent.length === 0
  const isSmallFile = file.size < 1 * 1024 * 1024

  if (isLargeTextFile) {
    // Case 1: Large text file. Place "Download" at the very beginning.
    // The standard text previews (Markdown, etc.) are already in `res` and will appear after it.
    res.unshift(downloadComponent)
  } else if (noPreviewsFound && isSmallFile) {
    // Case 2: No other previews found for a small file.
    // Add "Download" first, then suggest default text previews.
    res.push(downloadComponent)
    const textPreviewsToAdd = previews
      .filter((p) =>
        ["Markdown", "Markdown with word wrap", "Text Editor"].includes(p.name),
      )
      .map((p) => ({ name: p.name, component: p.component }))
    res.push(...textPreviewsToAdd)
  } else {
    // Case 3: The "normal" case for all other files (images, videos, small text files, etc.).
    // Add "Download" as the last fallback option in the high-priority list.
    res.push(downloadComponent)
  }
  return res.concat(subsequent)
}
