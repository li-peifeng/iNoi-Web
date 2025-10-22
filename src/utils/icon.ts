import {
  BsFileEarmarkWordFill,
  BsFileEarmarkExcelFill,
  BsFileEarmarkPptFill,
  BsFileEarmarkPdfFill,
  BsFileEarmarkPlayFill,
  BsFileEarmarkMusicFill,
  BsFileEarmarkFontFill,
  BsFileEarmarkImageFill,
  BsFileEarmarkMinusFill,
  BsApple,
  BsWindows,
  BsFileEarmarkZipFill,
  BsMarkdownFill,
  BsDeviceHddFill,
} from "solid-icons/bs"
import {
  FaSolidDatabase,
  FaSolidBook,
  FaSolidCompactDisc,
  FaSolidLink,
} from "solid-icons/fa"
import { IoFolder } from "solid-icons/io"
import { ImAndroid, ImGoogleDrive, ImOnedrive } from "solid-icons/im"
import { Obj, ObjType } from "~/types"
import { ext } from "./path"
import {
  VscodeIconsFileTypeAi2,
  VscodeIconsFileTypePhotoshop2,
} from "~/components"
import { SiAsciinema } from "solid-icons/si"
import { isArchive } from "~/store/archive"
import { AiFillGithub } from "solid-icons/ai"
import { RiLogosNeteaseCloudMusicFill } from "solid-icons/ri"
import { FolderIcon } from "~/components"

const iconMap = {
  "dmg,ipa,plist,tipa": BsApple,
  "exe,msi": BsWindows,
  apk: ImAndroid,
  db: FaSolidDatabase,
  md: BsMarkdownFill,
  epub: FaSolidBook,
  iso: FaSolidCompactDisc,
  m3u8: BsFileEarmarkPlayFill,
  "doc,docx": BsFileEarmarkWordFill,
  "xls,xlsx": BsFileEarmarkExcelFill,
  "ppt,pptx": BsFileEarmarkPptFill,
  pdf: BsFileEarmarkPdfFill,
  psd: VscodeIconsFileTypePhotoshop2,
  ai: VscodeIconsFileTypeAi2,
  url: FaSolidLink,
  cast: SiAsciinema,
}

export const getIconByTypeAndName = (type: number, name: string) => {
  if (type !== ObjType.FOLDER) {
    for (const [extensions, icon] of Object.entries(iconMap)) {
      if (extensions.split(",").includes(ext(name).toLowerCase())) {
        return icon
      }
    }
    if (isArchive(name)) {
      return BsFileEarmarkZipFill
    }
  }
  switch (type) {
    case ObjType.FOLDER:
      return FolderIcon
    case ObjType.VIDEO:
      return BsFileEarmarkPlayFill
    case ObjType.AUDIO:
      return BsFileEarmarkMusicFill
    case ObjType.TEXT:
      return BsFileEarmarkFontFill
    case ObjType.IMAGE:
      return BsFileEarmarkImageFill
    default:
      return BsFileEarmarkMinusFill
  }
}

export const getIconByDriver = (driverName: string) => {
  switch (driverName) {
    case "Local":
      return BsDeviceHddFill
    case "GitHub API":
    case "GitHub Releases":
      return AiFillGithub
    case "GoogleDrive":
      return ImGoogleDrive
    case "NeteaseMusic":
      return RiLogosNeteaseCloudMusicFill
    case "Onedrive":
    case "OnedriveApp":
    case "Onedrive Sharelink":
      return ImOnedrive
    default:
      return BsDeviceHddFill
  }
}

export const getIconByObj = (
  obj: Pick<Obj, "type" | "name" | "mount_details">,
) => {
  if (obj.mount_details) {
    return getIconByDriver(obj.mount_details.driver_name)
  }
  return getIconByTypeAndName(obj.type, obj.name)
}
