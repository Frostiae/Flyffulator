import { useState } from "react";
import { useTranslation } from "react-i18next";

function ImportCharacter({ open, onImport }) {
    const { t } = useTranslation();
    const [importJSON, setImportJSON] = useState("");

    function importCharacter() {
        onImport(importJSON);
    }

    return (
        <div id="import-menu" style={{ display: open ? "flex" : "none" }}>
            <input type="text" name="json" id="search-field" placeholder={`Insert JSON string...`} onChange={e => setImportJSON(e.target.value)} />
            <button className='flyff-button' onClick={importCharacter}>{t("import")}</button>
        </div>
    );
}

export default ImportCharacter;
