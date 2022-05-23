import styled from 'styled-components';

import { User as UserType } from '@/global_state/user';
import Avatar, { Shape } from '@/components/avatar';
import globalEventemitter, {
  EventType as GlobalEventType,
} from '@/platform/global_eventemitter';
import eventemitter, { EventType } from '../eventemitter';

const AVATAR_SIZE = 100;
const Style = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
  > .avatar {
    cursor: pointer;
    border: 1px solid var(--color-primary);
  }
  > .nickname {
    cursor: pointer;
    font-size: 14px;
    color: rgb(55 55 55);
    &:hover {
      color: #000;
    }
  }
`;
const openProfileDialog = () =>
  globalEventemitter.emit(GlobalEventType.OPEN_PROFILE_DIALOG);

function User({ user }: { user: UserType }) {
  return (
    <Style>
      <Avatar
        className="avatar"
        animated
        src={user.avatar}
        size={AVATAR_SIZE}
        shape={Shape.CIRCLE}
        onClick={openProfileDialog}
      />
      <div
        className="nickname"
        onClick={() =>
          eventemitter.emit(EventType.OPEN_USER_DRAWER, { id: user.id })
        }
      >
        {user.nickname}
      </div>
    </Style>
  );
}

export default User;