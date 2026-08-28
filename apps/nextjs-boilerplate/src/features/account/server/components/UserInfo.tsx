import type { User } from '@shared/config'
import { User as UserIcon } from 'lucide-react'

import { Avatar, AvatarImage } from '@/components/molecules'

import { fetchProfileImage } from '../../client/api'

interface UserInfoProps {
  user: User
}

export async function UserInfo({ user }: Readonly<UserInfoProps>) {
  const imageUrl = fetchProfileImage(user.imagePath ?? '')

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center justify-center">
        {imageUrl ? (
          <Avatar className="size-14 border-2 border-black">
            <AvatarImage src={imageUrl} />
          </Avatar>
        ) : (
          <UserIcon className="size-14 rounded-full border-2 border-black" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-1">
          <h1 className="text-3xl font-bold">{user.name}</h1>
        </div>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
    </div>
  )
}
