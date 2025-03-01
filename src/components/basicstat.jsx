import HoverInfo from './hoverinfo';

function BasicStat({ title, information, sourceLink, value, percentage }) {
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
                <HoverInfo text="View calculation code 🔗" icon="code-icon.svg" link={sourceLink} />
            }
        </div>
    );
}

export default BasicStat;