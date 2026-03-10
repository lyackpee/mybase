import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Package, MapPin, Search, LayoutGrid, Camera, Image,
  Trash2, X, Moon, Sun, Home, Plus, Tag, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUPABASE_URL = 'https://hisodgxpyycpmgovxcsx.supabase.co';
const SUPABASE_KEY = 'TVOJ_KEYsb_publishable_IOUW8LgbWlL7k-f0-dZ3qw_uKQewIrT';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_PROSTORIJE = ['dnevni boravak', 'kuhinja', 'spavaća soba', 'garaža', 'podrum'];
const DEFAULT_KATEGORIJE = ['elektronika', 'alati', 'dokumenti', 'foto oprema', 'odjeća', 'kuhinja', 'ostalo'];

export default function App() {
  const [items, setItems] = useState([]);
  const [view, setView] = useState('catalog');
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Sve');
  const [darkMode, setDarkMode] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [prostorije, setProstorije] = useState(DEFAULT_PROSTORIJE);
  const [kategorije, setKategorije] = useState(DEFAULT_KATEGORIJE);

  // Inline input stanja za settings
  const [newProstorija, setNewProstorija] = useState('');
  const [newKategorija, setNewKategorija] = useState('');

  const [formData, setFormData] = useState({
    naziv: '',
    prostorija: DEFAULT_PROSTORIJE[0],
    kategorija: DEFAULT_KATEGORIJE[0],
    fotoFile: null,
    previewUrl: null
  });

  useEffect(() => {
    fetchItems();
    const sp = localStorage.getItem('liste_p');
    const sk = localStorage.getItem('liste_k');
    if (sp) { const p = JSON.parse(sp); setProstorije(p); setFormData(f => ({ ...f, prostorija: p[0] ?? '' })); }
    if (sk) { const k = JSON.parse(sk); setKategorije(k); setFormData(f => ({ ...f, kategorija: k[0] ?? '' })); }
  }, []);

  useEffect(() => { localStorage.setItem('liste_p', JSON.stringify(prostorije)); }, [prostorije]);
  useEffect(() => { localStorage.setItem('liste_k', JSON.stringify(kategorije)); }, [kategorije]);

  const fetchItems = async () => {
    const { data } = await supabase.from('stvari').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (formData.previewUrl) URL.revokeObjectURL(formData.previewUrl);
    setFormData({ ...formData, fotoFile: file, previewUrl: URL.createObjectURL(file) });
  };

  const resetForm = () => {
    if (formData.previewUrl) URL.revokeObjectURL(formData.previewUrl);
    setFormData({ naziv: '', prostorija: prostorije[0] ?? '', kategorija: kategorije[0] ?? '', fotoFile: null, previewUrl: null });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setUploading(true);
    let publicUrl = '';
    try {
      if (formData.fotoFile) {
        const fileName = `${Date.now()}_${formData.naziv.replace(/\s/g, '_')}.jpg`;
        const { error: upErr } = await supabase.storage.from('slike_inventara').upload(fileName, formData.fotoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('slike_inventara').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      }
      const { error: dbErr } = await supabase.from('stvari').insert([{
        naziv: formData.naziv,
        prostorija: formData.prostorija,
        kategorija: formData.kategorija,
        foto: publicUrl
      }]);
      if (dbErr) throw dbErr;
      fetchItems();
      setView('catalog');
      resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm('Trajno obrisati?')) return;
    await supabase.from('stvari').delete().eq('id', item.id);
    fetchItems();
    setSelectedItem(null);
  };

  const addProstorija = () => {
    const val = newProstorija.trim().toLowerCase();
    if (!val || prostorije.includes(val)) return;
    setProstorije([...prostorije, val]);
    setNewProstorija('');
  };

  const addKategorija = () => {
    const val = newKategorija.trim().toLowerCase();
    if (!val || kategorije.includes(val)) return;
    setKategorije([...kategorije, val]);
    setNewKategorija('');
  };

  const filteredItems = items.filter(i =>
    i.naziv.toLowerCase().includes(search.toLowerCase()) &&
    (activeFilter === 'Sve' || i.prostorija === activeFilter || i.kategorija === activeFilter)
  );

  const dk = darkMode;

  // Reusable inline-add input
  const AddInput = ({ value, onChange, onAdd, placeholder, color = 'blue' }) => (
    <div className={`flex gap-2 mt-2`}>
      <input
        className={`flex-1 p-4 rounded-[20px] outline-none text-xs font-bold uppercase tracking-widest ${dk ? 'bg-[#1a1a1a] border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-800'}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onAdd()}
      />
      <button
        onClick={onAdd}
        disabled={!value.trim()}
        className={`p-4 rounded-[20px] transition-all disabled:opacity-20 ${color === 'violet' ? 'bg-violet-600 shadow-lg shadow-violet-600/20' : 'bg-blue-600 shadow-lg shadow-blue-600/20'} text-white`}
      >
        <Check size={18} />
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 ${dk ? 'bg-black text-white' : 'bg-[#f4f7f6] text-[#1a1c1e]'} pb-32 font-sans`}>

      {/* HEADER */}
      <header className={`sticky top-0 z-40 p-5 flex justify-between items-center border-b backdrop-blur-md ${dk ? 'bg-black/80 border-white/10' : 'bg-white/80 border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white"><Package size={22} /></div>
          <h1 className="font-black text-xl uppercase italic tracking-widest">MyBase</h1>
        </div>
        <button onClick={() => setDarkMode(!dk)} className="p-2 opacity-70">
          {dk ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </header>

      <main className="max-w-xl mx-auto p-4">

        {/* KATALOG */}
        {view === 'catalog' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                className={`w-full p-5 pl-12 rounded-[24px] outline-none shadow-sm ${dk ? 'bg-[#121212] text-white' : 'bg-white border border-gray-100'}`}
                placeholder="Pretraži..." value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
              {['Sve', ...prostorije].map(p => (
                <button key={p} onClick={() => setActiveFilter(p)}
                  className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap
                    ${activeFilter === p ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30'
                      : dk ? 'bg-[#121212] border-white/5 text-gray-500' : 'bg-white border-gray-100 text-gray-400'}`}
                >{p}</button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <motion.div layout key={item.id} onClick={() => setSelectedItem(item)}
                  className={`p-2 rounded-[35px] border transition-all active:scale-95 ${dk ? 'bg-[#121212] border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <div className="aspect-square rounded-[30px] overflow-hidden bg-gray-900 mb-3 flex items-center justify-center">
                    {item.foto ? <img src={item.foto} className="w-full h-full object-cover" alt={item.naziv} /> : <Package className="opacity-10" size={48} />}
                  </div>
                  <div className="px-3 pb-2 text-center">
                    <h3 className="font-bold text-xs truncate uppercase tracking-tighter italic">{item.naziv}</h3>
                    {item.kategorija && <span className="text-[9px] text-violet-400 font-black uppercase tracking-widest opacity-70">{item.kategorija}</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* DODAJ PREDMET */}
        {view === 'add' && (
          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAddItem} className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black italic uppercase">Novi predmet</h2>
              <button type="button" onClick={() => { setView('catalog'); resetForm(); }}><X /></button>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className={`w-48 h-48 rounded-[50px] overflow-hidden border-2 border-dashed flex items-center justify-center ${dk ? 'bg-[#121212] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                {formData.previewUrl ? <img src={formData.previewUrl} className="w-full h-full object-cover" alt="preview" /> : <Camera size={40} className="opacity-10" />}
              </div>
              <div className="flex gap-3 w-full px-2">
                <label className="flex-1 p-4 bg-blue-600 text-white rounded-[24px] text-center cursor-pointer font-black text-[10px] uppercase shadow-lg shadow-blue-600/20">
                  <Camera className="mx-auto mb-1" /> Kamera
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                </label>
                <label className={`flex-1 p-4 rounded-[24px] text-center cursor-pointer font-black text-[10px] uppercase border ${dk ? 'bg-[#121212] border-white/5' : 'bg-white'}`}>
                  <Image className="mx-auto mb-1" /> Galerija
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <input required
                className={`w-full p-5 rounded-[24px] outline-none font-bold text-lg ${dk ? 'bg-[#121212]' : 'bg-white border'}`}
                placeholder="Naziv predmeta..." value={formData.naziv}
                onChange={e => setFormData({ ...formData, naziv: e.target.value })}
              />

              <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] ml-4">Odaberi sobu</p>
              <div className="flex flex-wrap gap-2">
                {prostorije.map(p => (
                  <button key={p} type="button" onClick={() => setFormData({ ...formData, prostorija: p })}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border transition-all
                      ${formData.prostorija === p ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                        : dk ? 'bg-[#121212] border-white/10 text-gray-500' : 'bg-white border-gray-100'}`}
                  >{p}</button>
                ))}
              </div>

              <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] ml-4 pt-2">Odaberi kategoriju</p>
              <div className="flex flex-wrap gap-2">
                {kategorije.map(k => (
                  <button key={k} type="button" onClick={() => setFormData({ ...formData, kategorija: k })}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border transition-all
                      ${formData.kategorija === k ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-600/20'
                        : dk ? 'bg-[#121212] border-white/10 text-gray-500' : 'bg-white border-gray-100'}`}
                  >{k}</button>
                ))}
              </div>
            </div>

            <button disabled={uploading} type="submit"
              className="w-full bg-blue-600 text-white py-6 rounded-[30px] font-black text-xl shadow-2xl active:scale-95 transition-all italic uppercase disabled:opacity-50">
              {uploading ? 'Slanje u Cloud...' : 'Spremi predmet'}
            </button>
          </motion.form>
        )}

        {/* PODEŠAVANJA */}
        {view === 'settings' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Podešavanja</h2>
              <button onClick={() => setView('catalog')}><X /></button>
            </div>

            {/* PROSTORIJE */}
            <div>
              <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] ml-2 mb-3">Prostorije</p>
              <div className="grid grid-cols-1 gap-2">
                <AnimatePresence>
                  {prostorije.map(p => (
                    <motion.div key={p} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      className={`p-5 rounded-[25px] flex justify-between items-center border ${dk ? 'bg-[#121212] border-white/5' : 'bg-white'}`}>
                      <span className="font-bold uppercase text-xs tracking-widest">{p}</span>
                      <button onClick={() => setProstorije(prostorije.filter(x => x !== p))} className="text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <AddInput
                  value={newProstorija}
                  onChange={setNewProstorija}
                  onAdd={addProstorija}
                  placeholder="Nova prostorija..."
                  color="blue"
                />
              </div>
            </div>

            {/* KATEGORIJE */}
            <div>
              <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] ml-2 mb-3">Kategorije</p>
              <div className="grid grid-cols-1 gap-2">
                <AnimatePresence>
                  {kategorije.map(k => (
                    <motion.div key={k} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      className={`p-5 rounded-[25px] flex justify-between items-center border ${dk ? 'bg-[#121212] border-white/5' : 'bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <Tag size={14} className="text-violet-500 opacity-60" />
                        <span className="font-bold uppercase text-xs tracking-widest">{k}</span>
                      </div>
                      <button onClick={() => setKategorije(kategorije.filter(x => x !== k))} className="text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <AddInput
                  value={newKategorija}
                  onChange={setNewKategorija}
                  onAdd={addKategorija}
                  placeholder="Nova kategorija..."
                  color="violet"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* NAVIGACIJA */}
      <nav className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm border shadow-2xl rounded-full p-2 flex justify-around items-center z-50 ${dk ? 'bg-[#121212]/90 border-white/10 backdrop-blur-2xl' : 'bg-white/95 border-gray-100 backdrop-blur-2xl'}`}>
        <button onClick={() => setView('catalog')} className={`p-4 rounded-full ${view === 'catalog' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}><LayoutGrid size={24} /></button>
        <button onClick={() => setView('settings')} className={`p-4 rounded-full ${view === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}><Home size={24} /></button>
        <button onClick={() => setView('add')} className={`p-4 rounded-full ${view === 'add' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-500'}`}><Plus size={24} /></button>
      </nav>

      {/* MODAL DETALJA */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedItem(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()}
              className={`w-full max-w-md rounded-[50px] overflow-hidden shadow-2xl ${dk ? 'bg-[#121212]' : 'bg-white'}`}>
              <div className="h-80 relative flex items-center justify-center bg-gray-900">
                {selectedItem.foto ? <img src={selectedItem.foto} className="w-full h-full object-cover" alt={selectedItem.naziv} /> : <Package size={80} className="opacity-10" />}
                <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 p-4 bg-black/40 backdrop-blur-xl rounded-full text-white"><X size={20} /></button>
              </div>
              <div className="p-10 space-y-4">
                <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">{selectedItem.naziv}</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest opacity-40"><MapPin size={12} /> {selectedItem.prostorija}</div>
                  {selectedItem.kategorija && <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-violet-400"><Tag size={12} /> {selectedItem.kategorija}</div>}
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => handleDeleteItem(selectedItem)} className="p-6 bg-red-500/10 text-red-500 rounded-[30px] hover:bg-red-500/20 transition-colors"><Trash2 size={24} /></button>
                  <button onClick={() => setSelectedItem(null)} className="flex-grow bg-blue-600 text-white py-6 rounded-[30px] font-black uppercase tracking-widest shadow-xl">Zatvori</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}