import HoverInfo from './hoverinfo';
import { useTranslation } from "react-i18next";

function BasicStat({ title, information, sourceLink, value, percentage }) {
    const { t } = useTranslation();
    return (
        <div className="basic-stat">
            <span className="basic-label">{title}</span>
            <span className="basic-value">{value}{percentage ? "%" : ""}</span>
            {
                information != undefined &&
                <HoverInfo text={information} />
            }
            {
                sourceLink != undefined &&
                <HoverInfo text={t("view_calculation_code")} icon="code-icon.svg" link={sourceLink} />
            }
        </div>
    );
}

export default BasicStat;