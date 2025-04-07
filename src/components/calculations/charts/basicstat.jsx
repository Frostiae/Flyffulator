import HoverInfo from '../../shared/hoverinfo';
import { useTranslation } from "react-i18next";

function BasicStat({ title, information, sourceLink, value, percentage, optional }) {
    const { t } = useTranslation();

    if (value === 0 && optional) {
        return null;
    }

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