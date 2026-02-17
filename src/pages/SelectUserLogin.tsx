import { useState } from "react";
import AuthLayout from "../components/Auth/AuthLayout";
import { users } from "../data/usersLogin";
import { ArrowLeft, Search, UserCircle } from "lucide-react";

const SelectUser = () => {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthLayout>
      {/* Back */}
      <button className="flex items-center gap-1 text-sm text-yellow-700 mb-4">
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Icon */}
      <div className="flex justify-center mb-3">
        <UserCircle size={48} />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-4">Select User</h1>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search for user by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full
            h-11
            rounded-lg
            bg-gray-200
            px-4
            pr-10
            text-sm
            placeholder-gray-500
            focus:outline-none
          "
        />
        <Search
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
      </div>

      {/* User List */}
      <div className="max-h-[320px] overflow-y-auto divide-y">
        {filteredUsers.map((user) => (
          <button
            key={user.id}
            className="
              w-full
              flex
              items-center
              gap-3
              py-3
              hover:bg-yellow-50
              transition
              text-left
            "
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />

            <div className="flex-1">
              <p className="text-sm font-medium">{user.name}</p>
            </div>

            <p className="text-sm text-gray-600">User ID: {user.id}</p>
          </button>
        ))}
      </div>
    </AuthLayout>
  );
};

export default SelectUser;
