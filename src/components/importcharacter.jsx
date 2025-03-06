import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function ImportCharacter({ open, onImport, close }) {
    const { t } = useTranslation();
    const [hasError, setError] = useState(false);
    const [importJSON, setImportJSON] = useState("");
    const [buildName, setBuildName] = useState();

    useEffect(() => {
        try {
            const buildName = JSON.parse(importJSON).buildName;
            setBuildName(buildName);
        } catch (err) {
            setBuildName(undefined);
            // do nothing.. json may be invalid
        }
    }, [importJSON]);

    function importCharacter() {
        setError(false);
        try {
            onImport(importJSON);
        } catch (err) {
            console.error(err);
            setError(true);
        }

        setImportJSON('');
    }

    function cancel() {
        setImportJSON('');
        setError(false);
        close();
    }

    if (!open) {
        return null;
    }

    return (
        <div className="search-modal" id="import-menu" onClick={close} onKeyDown={(e) => { if (e.key == "Escape") close(); }}>
            <div id="search-box" onClick={(e) => e.stopPropagation()}>
                <div className="window-title">{t("import")}</div>
                <div className="window-content">
                    <input type="text" name="json" id="search-field" placeholder={`Insert JSON string...`} onChange={e => { setImportJSON(e.target.value); setError(false); }} value={importJSON} />
                    <div style={{ display: 'flex' }}>
                        <button className='flyff-button' onClick={importCharacter}>{t("import")}</button>
                        <button className='flyff-button' onClick={cancel}>{t("cancel")}</button>
                    </div>
                    {buildName && (
                        <div id="import-name">
                            Build name: {buildName}
                        </div>
                    )}
                    {hasError && (
                        <div id="import-error">
                            Whoops... that build didn't quite work.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ImportCharacter;
