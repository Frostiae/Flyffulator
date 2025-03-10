import { useTranslation } from "react-i18next";

function Localizer({prefix, parameter}) {
  const { i18n } = useTranslation();

  return i18n.exists(prefix + parameter) ? i18n.t(prefix + parameter) : parameter;
}

export default Localizer;