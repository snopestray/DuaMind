import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- CONSTANTS ---
const STYLES = ['kurz', 'mittel', 'poetisch', 'klassisch'];
const TOPICS = ['Vergebung', 'Dankbarkeit', 'Angst & Sorgen', 'Hoffnung', 'Familie', 'Motivation', 'Nähe zu Allah', 'Tod & Jenseits'];
const SENSITIVE_KEYWORDS = ['suizid', 'selbstmord', 'umbringen', 'töten', 'selbstverletzung'];
const PRAYER_BOOK_KEY = 'duaMindPrayerBook';
const MAX_SAVED_DUAS = 100;

// --- TYPES ---
interface Dua {
    id: number;
    duaText: string;
    topic: string;
    style: string;
    date: string;
    withAnrede: boolean;
    isFavorite?: boolean;
}

// --- SVG ICONS ---
const StarIcon = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill={filled ? '#FFC107' : 'currentColor'} style={{ display: 'block' }}>
        <path d="m354-247 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25L700-401l65 281-245-146-247 146Z"/>
    </svg>
);
const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-720v480-480Z"/></svg>
);
const DeleteIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
);


// --- UI COMPONENTS ---

const Nav = ({ mainView, setMainView, duaCount }) => (
    <div style={styles.navContainer}>
        <button style={mainView === 'generator' ? styles.navButtonActive : styles.navButton} onClick={() => setMainView('generator')} aria-pressed={mainView === 'generator'}>
            Generator
        </button>
        <button style={mainView === 'prayerBook' ? styles.navButtonActive : styles.navButton} onClick={() => setMainView('prayerBook')} aria-pressed={mainView === 'prayerBook'}>
            Mein Gebetsbuch ({duaCount})
        </button>
    </div>
);

const GeneratorForm = ({ userInput, setUserInput, selectedStyle, selectedTopic, includeAnrede, setIncludeAnrede, error, isLoading, handleGenerateDua, setActiveMenu }) => (
    <>
        <p style={styles.headerHint}>Sprich aus, was dein Herz fühlt – und finde Worte im Licht.</p>
        <h1 style={styles.title}>Formuliere mein Gebet</h1>
        <p style={styles.subtitle}>Gib Stichworte ein, was dich bewegt. DuaMind formuliert daraus ein persönliches Bittgebet.</p>
        <div style={styles.card}>
            <textarea style={styles.textarea} placeholder="Schreibe stichwortartig, was dich beschäftigt…" value={userInput} onChange={(e) => setUserInput(e.target.value)} aria-label="Eingabefeld für Gebets-Stichworte" />
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <button style={styles.selectControl} onClick={() => setActiveMenu('style')} aria-haspopup="listbox">
                    <span style={styles.selectLabel}>Stil</span>
                    <div style={{display: 'flex', alignItems: 'center'}}><span style={styles.selectValue}>{selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)}</span><span style={styles.selectIcon}>▾</span></div>
                </button>
                <button style={styles.selectControl} onClick={() => setActiveMenu('topic')} aria-haspopup="listbox">
                    <span style={styles.selectLabel}>Thema</span>
                    <div style={{display: 'flex', alignItems: 'center'}}><span style={styles.selectValue}>{selectedTopic}</span><span style={styles.selectIcon}>▾</span></div>
                </button>
            </div>
            <div style={styles.toggleContainer}>
                <label htmlFor="anrede-toggle" style={styles.toggleLabel}>Mit "O Allah..." beginnen</label>
                <button id="anrede-toggle" role="switch" aria-checked={includeAnrede} onClick={() => setIncludeAnrede(!includeAnrede)} style={{...styles.toggleSwitch, ...(includeAnrede ? styles.toggleSwitchOn : {})}}>
                    <span style={{...styles.toggleKnob, ...(includeAnrede ? styles.toggleKnobOn : {})}}></span>
                </button>
            </div>
        </div>
        {error && <p style={styles.errorText}>{error}</p>}
        <button onClick={handleGenerateDua} style={styles.generateButton} disabled={isLoading} className="primary-button">
            {isLoading ? <div style={styles.spinner}></div> : 'Gebet generieren'}
        </button>
    </>
);

const GeneratorResult = ({ dua, showSafetyNotice, handleSaveDua, handleSaveAsImage, handleSaveAsPdf, setGeneratorView, setError, setSnackbar }) => {
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(dua)
            .then(() => setSnackbar('In die Zwischenablage kopiert'))
            .catch(() => setSnackbar('Kopieren fehlgeschlagen'));
    };
    
    return (
        <>
            <h1 style={styles.title}>Dein persönliches Gebet</h1>
            <div style={styles.card}>
                 <button onClick={handleCopyToClipboard} style={styles.copyButton} aria-label="Gebetstext kopieren">
                    <CopyIcon />
                </button>
                <p style={styles.duaText}>{dua.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>
            </div>
            {showSafetyNotice && (
                <div style={{...styles.card, marginTop: '16px', backgroundColor: '#FFFBEB'}}><p style={{...styles.safetyNotice}}><b>Wichtiger Hinweis:</b> Wenn du dich unsicher oder gefährdet fühlst, suche bitte sofort Hilfe bei Vertrauenspersonen oder lokalen Beratungsstellen. Du bist nicht allein.</p></div>
            )}
            <div style={styles.actionButtonsContainer}>
                <button onClick={handleSaveDua} style={{...styles.actionButton, flex: 1.5, color: '#FFFFFF', backgroundColor: '#3D7C67', borderColor: '#3D7C67'}} className="secondary-button">Im Gebetsbuch speichern</button>
                <button onClick={handleSaveAsImage} style={styles.actionButton} className="secondary-button">Als Bild</button>
                <button onClick={handleSaveAsPdf} style={styles.actionButton} className="secondary-button">Als PDF</button>
            </div>
            <button onClick={() => { setGeneratorView('form'); setError(''); }} style={{...styles.generateButton, marginTop: '16px', backgroundColor: '#F1F5F3', color: '#3D7C67', border: '1px solid #E0E0E0'}} className="secondary-button">
                Neu generieren
            </button>
        </>
    );
};

const PrayerBookList = ({ duas, filter, setFilter, onSelectDua, onDeleteDua, onToggleFavorite }) => (
    <>
        <h1 style={styles.title}>Mein Gebetsbuch</h1>
        {duas.length === 0 ? (
            <p style={styles.subtitle}>Dein Gebetsbuch ist noch leer. Generiere ein Gebet und speichere es hier.</p>
        ) : (
            <>
                <div style={styles.filterContainer}>
                    <button onClick={() => setFilter('all')} style={filter === 'all' ? styles.filterButtonActive : styles.filterButton}>Alle</button>
                    <button onClick={() => setFilter('favorites')} style={filter === 'favorites' ? styles.filterButtonActive : styles.filterButton}>Favoriten</button>
                </div>
                <div style={styles.prayerBookList}>
                    {duas.map(duaItem => (
                        <div key={duaItem.id} style={styles.prayerBookCard} onClick={() => onSelectDua(duaItem)} onKeyDown={(e) => e.key === 'Enter' && onSelectDua(duaItem)} tabIndex={0} role="button" aria-label={`Gebet zum Thema ${duaItem.topic} ansehen`}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={styles.prayerBookCardText}>{duaItem.duaText.length > 120 ? duaItem.duaText.substring(0, 120) + '…' : duaItem.duaText}</p>
                                    <p style={styles.prayerBookCardMeta}>{duaItem.topic} • {new Date(duaItem.date).toLocaleDateString('de-DE')}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                     <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(duaItem.id); }} style={styles.iconButton} aria-label={duaItem.isFavorite ? "Als Favorit entfernen" : "Als Favorit markieren"}>
                                        <StarIcon filled={duaItem.isFavorite} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteDua(duaItem.id); }} className="deleteButton" style={styles.iconButton} aria-label="Gebet löschen">
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        )}
    </>
);

const PrayerDetailView = ({ dua, onBack, onDeleteDua, onToggleFavorite, handleSaveAsImage, handleSaveAsPdf }) => (
    <>
        <h1 style={styles.title}>Gebet vom {new Date(dua.date).toLocaleDateString('de-DE')}</h1>
        <div style={styles.card}>
            <p style={styles.duaText}>{dua.duaText.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>
        </div>
        <div style={styles.actionButtonsContainer}>
             <button onClick={() => onToggleFavorite(dua.id)} style={styles.actionButton} className="secondary-button" aria-label={dua.isFavorite ? "Als Favorit entfernen" : "Als Favorit markieren"}>
                <StarIcon filled={dua.isFavorite}/>
            </button>
            <button onClick={() => handleSaveAsImage(dua)} style={styles.actionButton} className="secondary-button">Als Bild</button>
            <button onClick={() => handleSaveAsPdf(dua)} style={styles.actionButton} className="secondary-button">Als PDF</button>
        </div>
        <div style={{...styles.actionButtonsContainer, marginTop: '12px'}}>
            <button onClick={onBack} style={{...styles.actionButton, flexGrow: 2}} className="primary-button">Zurück zur Übersicht</button>
            <button onClick={() => onDeleteDua(dua.id)} style={{...styles.actionButton, color: '#D32F2F', borderColor: '#D32F2F'}} className="secondary-button">Löschen</button>
        </div>
    </>
);

const BottomSheet = ({ activeMenu, setActiveMenu, selectedStyle, setSelectedStyle, selectedTopic, setSelectedTopic }) => {
    if (!activeMenu) return null;
    const isStyleMenu = activeMenu === 'style';
    const options = isStyleMenu ? STYLES : TOPICS;
    const title = isStyleMenu ? 'Stil auswählen' : 'Thema auswählen';
    const selectedValue = isStyleMenu ? selectedStyle : selectedTopic;
    const handleSelect = (option) => { isStyleMenu ? setSelectedStyle(option) : setSelectedTopic(option); setActiveMenu(null); };

    return (
        <div style={styles.bottomSheetBackdrop} onClick={() => setActiveMenu(null)}>
            <div style={styles.bottomSheetContainer} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="bottom-sheet-title">
                <h3 id="bottom-sheet-title" style={styles.bottomSheetTitle}>{title}</h3>
                <ul style={styles.bottomSheetList} role="listbox">
                    {options.map(option => ( <li key={option}> <button style={selectedValue === option ? styles.bottomSheetItemSelected : styles.bottomSheetItem} onClick={() => handleSelect(option)} role="option" aria-selected={selectedValue === option}> {isStyleMenu ? option.charAt(0).toUpperCase() + option.slice(1) : option} </button> </li> ))}
                </ul>
            </div>
        </div>
    );
};


const App = () => {
    // Main App State
    const [mainView, setMainView] = useState('generator'); // 'generator' | 'prayerBook'
    const [savedDuas, setSavedDuas] = useState<Dua[]>([]);
    const [selectedDua, setSelectedDua] = useState<Dua | null>(null);
    const [prayerBookFilter, setPrayerBookFilter] = useState('all'); // 'all' | 'favorites'
    
    // Global State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [activeMenu, setActiveMenu] = useState<null | 'style' | 'topic'>(null);
    
    // Generator State
    const [generatorView, setGeneratorView] = useState('form'); // 'form' or 'result'
    const [userInput, setUserInput] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('mittel');
    const [selectedTopic, setSelectedTopic] = useState('Dankbarkeit');
    const [includeAnrede, setIncludeAnrede] = useState(true);
    const [generatedDua, setGeneratedDua] = useState('');
    const [showSafetyNotice, setShowSafetyNotice] = useState(false);

    // --- LIFECYCLE & DATA HANDLING ---

    useEffect(() => {
        try {
            const storedDuas = localStorage.getItem(PRAYER_BOOK_KEY);
            setSavedDuas(storedDuas ? JSON.parse(storedDuas) : []);
        } catch (err) {
            console.error("Failed to load prayers from localStorage:", err);
        }
    }, []);

    const persistDuas = (duas) => {
        localStorage.setItem(PRAYER_BOOK_KEY, JSON.stringify(duas));
        setSavedDuas(duas);
    };

    useEffect(() => {
        if (snackbarMessage) {
            const timer = setTimeout(() => setSnackbarMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [snackbarMessage]);
    
    const handleMainViewChange = (view) => {
        setMainView(view);
        setSelectedDua(null); // Always reset detail view when switching main views
    };

    // --- LOGIC HANDLERS ---
    
    const getFormattedTimestamp = () => new Date().toISOString().slice(0, 16).replace(/[-T:]/g, '');

    const handleGenerateDua = async () => {
        if (userInput.length < 3 || userInput.length > 1000) {
            setError('Bitte schreibe 3 bis 1000 Zeichen, z. B. „Angst um Zukunft, innere Ruhe“.');
            return;
        }
        setError('');
        setIsLoading(true);
        setShowSafetyNotice(false);

        try {
            const systemInstruction = "Du formulierst islamisch zulässige Bittgebete auf Deutsch. Schreibe nur das Gebet, keine Erklärungen. Halte dich an Qur’an-/Sunnah-konforme Sprache. Keine Politik. Schreibe warm, demütig, klar. Nutze kurze Absätze. Passe Länge und Stil an die Parameter an.";
            const userInputContainsSensitiveKeywords = SENSITIVE_KEYWORDS.some(keyword => userInput.toLowerCase().includes(keyword));
            
            const userPrompt = userInputContainsSensitiveKeywords
                ? "Stichworte: Jemand fühlt sich verzweifelt und braucht Trost. | Thema: Hoffnung | Stil: kurz | Anrede einleiten: true. Formuliere ein sehr kurzes, tröstendes Gebet, das Hoffnung spendet, auf Deutsch, mit Absätzen, ohne Emojis."
                : `Stichworte: ${userInput} | Thema: ${selectedTopic} | Stil: ${selectedStyle} | Anrede einleiten: ${includeAnrede}. Formatiere als reines Gebet in Deutsch, mit Absätzen, ohne Emojis.`;

            if(userInputContainsSensitiveKeywords) setShowSafetyNotice(true);
            
            // Securely call the backend function
            const apiResponse = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userPrompt, systemInstruction })
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                throw new Error(errorData.error || 'API request failed');
            }

            const data = await apiResponse.json();
            
            setGeneratedDua(data.text);
            setGeneratorView('result');
        } catch (err) {
            console.error(err);
            setError('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveDua = () => {
        const newDua: Dua = {
            id: Date.now(),
            duaText: generatedDua,
            topic: selectedTopic,
            style: selectedStyle,
            date: new Date().toISOString(),
            withAnrede: includeAnrede,
            isFavorite: false
        };
        const updatedDuas = [newDua, ...savedDuas].slice(0, MAX_SAVED_DUAS);
        persistDuas(updatedDuas);
        setSnackbarMessage('Gebet im Gebetsbuch gespeichert');
    };

    const handleDeleteDua = (idToDelete) => {
        if (window.confirm("Möchtest du dieses Gebet wirklich löschen?")) {
            const updatedDuas = savedDuas.filter(d => d.id !== idToDelete);
            persistDuas(updatedDuas);
            setSnackbarMessage('Gebet gelöscht');
            if (selectedDua && selectedDua.id === idToDelete) {
                setSelectedDua(null);
            }
        }
    };
    
    const handleToggleFavorite = (idToToggle) => {
        const updatedDuas = savedDuas.map(d => 
            d.id === idToToggle ? { ...d, isFavorite: !d.isFavorite } : d
        );
        persistDuas(updatedDuas);
        if (selectedDua && selectedDua.id === idToToggle) {
            setSelectedDua(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
        }
    };

    // --- EXPORT LOGIC ---

    const prepareExportElement = (duaDetails) => {
        const { duaText, style, topic, date } = duaDetails;
        const container = document.createElement('div');
        Object.assign(container.style, { width: '700px', padding: '48px 40px 64px 40px', backgroundColor: '#FFFFFF', boxSizing: 'border-box', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' });
        const titleEl = document.createElement('h1');
        titleEl.innerText = 'Duʿāʾ';
        Object.assign(titleEl.style, { fontFamily: '"Helvetica Neue", Arial, sans-serif', fontSize: '24px', fontWeight: '600', letterSpacing: '0.5px', lineHeight: '1.3', textAlign: 'left', color: '#2F6B5A', paddingTop: '8px', borderBottom: '1px solid #E0E0E0', paddingBottom: '8px', marginBottom: '16px' });
        const metaEl = document.createElement('p');
        metaEl.innerText = `${style.charAt(0).toUpperCase() + style.slice(1)} / ${topic} / ${new Date(date).toLocaleDateString('de-DE')}`;
        Object.assign(metaEl.style, { color: '#777777', fontSize: '14px', letterSpacing: '0.5px', margin: '0 0 24px 0' });
        const textEl = document.createElement('p');
        textEl.innerHTML = duaText.replace(/\n/g, '<br>');
        Object.assign(textEl.style, { color: '#222222', fontSize: '18px', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: '0', textAlign: 'left' });
        container.append(titleEl, metaEl, textEl);
        return container;
    };
    
    const handleSaveAsImage = async (duaDetails) => {
        const element = prepareExportElement(duaDetails);
        document.body.appendChild(element);
        Object.assign(element.style, { position: 'absolute', left: '-9999px', top: '0' });
        try {
            const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#FFFFFF', useCORS: true, scrollY: -window.scrollY });
            const link = document.createElement('a');
            link.download = `DuaMind_${duaDetails.topic}_${getFormattedTimestamp()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            setSnackbarMessage('Bild wird heruntergeladen...');
        } catch (err) {
            console.error('Image generation failed:', err);
            setSnackbarMessage('Fehler bei der Bilderstellung.');
        } finally {
            document.body.removeChild(element);
        }
    };

    const handleSaveAsPdf = async (duaDetails) => {
        const element = prepareExportElement(duaDetails);
        document.body.appendChild(element);
        Object.assign(element.style, { position: 'absolute', left: '-9999px', top: '0' });
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const imgWidth = pdfWidth - 32; // 16mm margins
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 16, 18, imgWidth, imgHeight);
            pdf.save(`DuaMind_${duaDetails.topic}_${getFormattedTimestamp()}.pdf`);
            setSnackbarMessage('PDF wird heruntergeladen...');
        } catch(err) {
            console.error('PDF generation failed:', err);
            setSnackbarMessage('Fehler bei der PDF-Erstellung.');
        } finally {
            document.body.removeChild(element);
        }
    };
    
    // --- RENDER ---

    const sortedDuas = [...savedDuas].sort((a, b) => b.id - a.id);
    const filteredDuas = prayerBookFilter === 'favorites' ? sortedDuas.filter(d => d.isFavorite) : sortedDuas;
    
    const imageExportHandler = () => handleSaveAsImage({ duaText: generatedDua, style: selectedStyle, topic: selectedTopic, date: new Date().toISOString() });
    const pdfExportHandler = () => handleSaveAsPdf({ duaText: generatedDua, style: selectedStyle, topic: selectedTopic, date: new Date().toISOString() });

    return (
        <div style={styles.appContainer}>
            <Nav mainView={mainView} setMainView={handleMainViewChange} duaCount={savedDuas.length} />
            
            {mainView === 'generator' && (
                generatorView === 'form' 
                ? <GeneratorForm {...{userInput, setUserInput, selectedStyle, selectedTopic, includeAnrede, setIncludeAnrede, error, isLoading, handleGenerateDua, setActiveMenu}} /> 
                : <GeneratorResult dua={generatedDua} showSafetyNotice={showSafetyNotice} handleSaveDua={handleSaveDua} handleSaveAsImage={imageExportHandler} handleSaveAsPdf={pdfExportHandler} setGeneratorView={setGeneratorView} setError={setError} setSnackbar={setSnackbarMessage} />
            )}

            {mainView === 'prayerBook' && (
                selectedDua
                ? <PrayerDetailView dua={selectedDua} onBack={() => setSelectedDua(null)} onDeleteDua={handleDeleteDua} onToggleFavorite={handleToggleFavorite} handleSaveAsImage={handleSaveAsImage} handleSaveAsPdf={handleSaveAsPdf} />
                : <PrayerBookList duas={filteredDuas} filter={prayerBookFilter} setFilter={setPrayerBookFilter} onSelectDua={setSelectedDua} onDeleteDua={handleDeleteDua} onToggleFavorite={handleToggleFavorite} />
            )}

            <BottomSheet {...{activeMenu, setActiveMenu, selectedStyle, setSelectedStyle, selectedTopic, setSelectedTopic}} />
            
            <footer style={styles.footer}>
                Hinweis: Diese App formuliert Gebete, sie ersetzt keine Gelehrtenauskunft.
            </footer>
            
            {snackbarMessage && <div style={styles.snackbar}>{snackbarMessage}</div>}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    appContainer: { width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', alignItems: 'center', },
    headerHint: { fontSize: '15px', color: '#777777', textAlign: 'center', marginBottom: '8px', },
    title: { fontSize: '24px', fontWeight: '600', color: '#222222', textAlign: 'center', margin: '16px 0 8px 0', },
    subtitle: { fontSize: '16px', color: '#777777', textAlign: 'center', margin: '0 0 24px 0', lineHeight: 1.5, },
    card: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', width: '100%', boxSizing: 'border-box', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', position: 'relative', },
    textarea: { width: '100%', height: '120px', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '16px 14px', fontSize: '17px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: '24px', backgroundColor: '#FFFFFF', color: '#111111', lineHeight: 1.5, },
    selectControl: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 16px', border: '1px solid #E0E0E0', borderRadius: '12px', backgroundColor: '#FFFFFF', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', boxSizing: 'border-box', height: '52px', },
    selectLabel: { color: '#222222', fontWeight: '500', fontSize: '17px', },
    selectValue: { color: '#666666', marginRight: '8px', fontSize: '17px', },
    selectIcon: { color: '#888', fontWeight: 'bold', fontSize: '16px', opacity: 0.6, },
    toggleContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', },
    toggleLabel: { fontSize: '17px', color: '#222222', lineHeight: 1.5, },
    toggleSwitch: { position: 'relative', display: 'inline-block', width: '44px', height: '24px', backgroundColor: '#CCCCCC', borderRadius: '34px', border: 'none', cursor: 'pointer', transition: 'background-color 0.3s', },
    toggleSwitchOn: { backgroundColor: '#2F6B5A', },
    toggleKnob: { position: 'absolute', content: '""', height: '20px', width: '20px', left: '2px', bottom: '2px', backgroundColor: '#FFFFFF', borderRadius: '50%', transition: 'transform 0.3s', },
    toggleKnobOn: { transform: 'translateX(20px)', },
    generateButton: { width: '100%', padding: '0 24px', backgroundColor: '#3D7C67', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '600', cursor: 'pointer', marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '54px', boxSizing: 'border-box', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'background-color 0.2s ease', },
    errorText: { color: '#D32F2F', textAlign: 'center', marginTop: '16px', },
    spinner: { border: '4px solid rgba(255, 255, 255, 0.3)', borderRadius: '50%', borderTop: '4px solid #FFFFFF', width: '24px', height: '24px', animation: 'spin 1s linear infinite', },
    duaText: { fontSize: '18px', lineHeight: 1.7, color: '#222222', whiteSpace: 'pre-wrap', },
    copyButton: { position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#666666', padding: '8px', },
    actionButtonsContainer: { display: 'flex', gap: '12px', width: '100%', marginTop: '24px', },
    actionButton: { flex: 1, padding: '14px', backgroundColor: '#FFFFFF', color: '#3D7C67', border: '1px solid #E0E0E0', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    footer: { fontSize: '12px', color: '#777777', textAlign: 'center', marginTop: '32px', padding: '0 16px 16px 16px' },
    snackbar: { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(17, 17, 17, 0.9)', color: '#FFFFFF', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, animation: 'fadeIn 0.5s, fadeOut 0.5s 2.5s', },
    safetyNotice: { fontSize: '14px', lineHeight: 1.6, color: '#856404', margin: 0, },
    bottomSheetBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', animation: 'backdropFadeIn 0.3s ease', },
    bottomSheetContainer: { backgroundColor: '#FFFFFF', width: '100%', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '16px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))', boxSizing: 'border-box', maxHeight: '60vh', overflowY: 'auto', animation: 'slideUp 0.3s ease-out', },
    bottomSheetTitle: { fontSize: '18px', fontWeight: 'bold', color: '#111', textAlign: 'center', margin: '8px 0 24px 0', },
    bottomSheetList: { listStyle: 'none', padding: 0, margin: 0, },
    bottomSheetItem: { width: '100%', padding: '14px', fontSize: '16px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', color: '#111', },
    bottomSheetItemSelected: { width: '100%', padding: '14px', fontSize: '16px', border: 'none', backgroundColor: '#EAF0EE', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', color: '#2F6B5A', fontWeight: 'bold', },
    navContainer: { display: 'flex', width: '100%', backgroundColor: '#EAF0EE', borderRadius: '12px', padding: '4px', boxSizing: 'border-box', marginBottom: '24px' },
    navButton: { flex: 1, padding: '10px', fontSize: '16px', fontWeight: '600', border: 'none', backgroundColor: 'transparent', color: '#666666', borderRadius: '9px', cursor: 'pointer', transition: 'all 0.2s ease-in-out', },
    navButtonActive: { flex: 1, padding: '10px', fontSize: '16px', fontWeight: '600', border: 'none', backgroundColor: '#FFFFFF', color: '#2F6B5A', borderRadius: '9px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'all 0.2s ease-in-out', },
    prayerBookList: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', },
    prayerBookCard: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', width: '100%', boxSizing: 'border-box', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', position: 'relative', cursor: 'pointer', border: '1px solid transparent', transition: 'border-color 0.2s ease', },
    prayerBookCardText: { fontSize: '16px', color: '#222222', lineHeight: 1.6, margin: '0 0 12px 0', },
    prayerBookCardMeta: { fontSize: '14px', color: '#666666', margin: 0, },
    iconButton: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#999999', padding: '8px', borderRadius: '50%', transition: 'background-color 0.2s, color 0.2s' },
    filterContainer: { display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' },
    filterButton: { padding: '8px 16px', fontSize: '15px', fontWeight: '600', border: '1px solid #E0E0E0', backgroundColor: '#FFFFFF', color: '#666666', borderRadius: '9px', cursor: 'pointer', transition: 'all 0.2s ease-in-out', },
    filterButtonActive: { padding: '8px 16px', fontSize: '15px', fontWeight: '600', border: '1px solid #3D7C67', backgroundColor: '#EAF0EE', color: '#2F6B5A', borderRadius: '9px', cursor: 'pointer' },
};

export default App;
