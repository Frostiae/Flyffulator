import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Utils from "../../flyff/flyffutils";

// Class id / level the serializer defaults to when it strips those fields.
const DEFAULT_JOB_ID = 9686; // vagrant
const DEFAULT_LEVEL = 1;

function ImportCharacter({ open, onImport, close }) {
    const { t } = useTranslation();
    const [hasError, setError] = useState(false);
    const [importJSON, setImportJSON] = useState("");
    // Tracks whether the press that led to a click actually started on the
    // backdrop, so a text selection dragged out of the dialog and released on
    // the backdrop doesn't count as an outside click and close it.
    const pressedOnBackdrop = useRef(false);
    // Parsed summary of the pasted build ({ className, level }), or null if the
    // JSON isn't (yet) valid.
    const [buildInfo, setBuildInfo] = useState(null);
    // Editable build name, seeded from the pasted build and overridable before
    // importing.
    const [nameOverride, setNameOverride] = useState("");

    useEffect(() => {
        try {
            const obj = JSON.parse(importJSON);

            // job may be a bare class id, an object (older builds), or absent
            // (vagrant); level is stripped when it's the default.
            const rawJob = obj.job;
            const jobId = typeof rawJob === "object" && rawJob ? rawJob.id : (rawJob ?? DEFAULT_JOB_ID);
            const className = Utils.getClassById(jobId)?.name?.en ?? "Vagrant";

            setBuildInfo({ className, level: obj.level ?? DEFAULT_LEVEL });
            setNameOverride(obj.buildName ?? "");
        } catch (err) {
            setBuildInfo(null);
            setNameOverride("");
            // do nothing.. json may be invalid
        }
    }, [importJSON]);

    function importCharacter() {
        setError(false);
        try {
            onImport(importJSON, nameOverride.trim());
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
        <div
            className="search-modal"
            id="import-menu"
            onMouseDown={(e) => { pressedOnBackdrop.current = e.target === e.currentTarget; }}
            onClick={(e) => { if (e.target === e.currentTarget && pressedOnBackdrop.current) close(); }}
            onKeyDown={(e) => { if (e.key == "Escape") close(); }}
        >
            <div id="search-box" onClick={(e) => e.stopPropagation()}>
                <div className="window-title">{t("import")}</div>
                <div className="window-content">
                    <input autoFocus type="text" name="json" id="search-field" placeholder={`Insert JSON string...`} onChange={e => { setImportJSON(e.target.value); setError(false); }} value={importJSON} />
                    {buildInfo && (
                        <div id="import-name-row">
                            <label htmlFor="import-name-field">Build name</label>
                            <input type="text" id="import-name-field" placeholder="Build name" value={nameOverride} onChange={e => setNameOverride(e.target.value)} />
                        </div>
                    )}
                    <div style={{ display: 'flex' }}>
                        <button className='flyff-button' onClick={importCharacter}>{t("import")}</button>
                        <button className='flyff-button' onClick={cancel}>{t("cancel")}</button>
                    </div>
                    {buildInfo && (
                        <div id="import-details">
                            {buildInfo.className} Lv.{buildInfo.level}
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
