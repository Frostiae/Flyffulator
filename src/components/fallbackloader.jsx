import { Html, useProgress } from '@react-three/drei'
import { useTranslation } from "react-i18next";

function Loader() {
  const { t } = useTranslation();
  const { progress } = useProgress();
  return <Html center>{progress}{t("percent_loaded")}</Html>
}

export default Loader;