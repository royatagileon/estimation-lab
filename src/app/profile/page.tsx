export default function ProfilePage() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Your profile</h1>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">Display name</label>
        <input className="border rounded px-3 py-2" />
        <label className="text-sm">Screen name</label>
        <input className="border rounded px-3 py-2" />
        <label className="text-sm">Bio</label>
        <textarea className="border rounded px-3 py-2 col-span-1" />
        <label className="text-sm">Role</label>
        <select className="border rounded px-3 py-2">
          <option>MEMBER</option>
          <option>ADMIN</option>
        </select>
      </div>
      <button className="inline-flex rounded bg-black text-white px-4 py-2">Save</button>
    </div>
  );
}


