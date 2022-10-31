import Dialog, { Title, Content, Action } from '#/components/dialog';
import Button, { Variant } from '#/components/button';
import Input from '#/components/input';
import {
  ChangeEventHandler,
  CSSProperties,
  useCallback,
  useEffect,
  useState,
} from 'react';
import Select from '#/components/select';
import styled from 'styled-components';
import {
  MusicType,
  MUSIC_SQ,
  MUSIC_TYPES,
  MUSIC_TYPE_MAP,
  NAME_MAX_LENGTH,
} from '#/constants/music';
import FileSelect from '#/components/file_select';
import MultipleSelect from '#/components/multiple_select';
import searchSingerRequest from '@/server/search_singer';
import { ALIAS_DIVIDER, AssetType } from '#/constants';
import useEvent from '#/utils/use_event';
import notice from '#/utils/notice';
import uploadAsset from '@/server/upload_asset';
import createMusic from '@/server/create_music';
import { ZIndex } from '@/pages/player/constants';
import { CSSVariable } from '#/global_style';
import useOpen from './use_open';
import e, { EventType } from '../eventemitter';
import CreateSinger from './create_singer';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

const TypeTips = styled.div`
  font-size: 12px;
  color: ${CSSVariable.COLOR_DANGEROUS};
`;
const maskProps: { style: CSSProperties } = {
  style: { zIndex: ZIndex.DIALOG },
};
const TYPES = MUSIC_TYPES.map((t) => ({
  id: t,
  label: MUSIC_TYPE_MAP[t].label,
}));
const searchSinger = (search: string) => {
  const keyword = search.trim();
  return searchSingerRequest({ keyword, page: 1, pageSize: 50 }).then((data) =>
    data.singerList.map((s) => ({
      id: s.id,
      label: `${s.name}${
        s.aliases ? `(${s.aliases.split(ALIAS_DIVIDER)[0]})` : ''
      }`,
    })),
  );
};

const StyledContent = styled(Content)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

function CreateMusicDialog() {
  const { open, onClose } = useOpen();

  const [name, setName] = useState('');
  const onNameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setName(event.target.value);

  const [singerList, setSingerList] = useState<{ id: string; label: string }[]>(
    [],
  );
  const onSingerListChange = useCallback(
    (sl: { id: string; label: string }[]) => setSingerList(sl),
    [],
  );

  const [musicType, setMusicType] = useState(MusicType.SONG);
  const onMusicTypeChange = (t: MusicType) => setMusicType(t);

  const [sq, setSq] = useState<File | null>(null);
  const onSqChange = (s) => setSq(s);

  const [loading, setLoading] = useState(false);
  const onCreate = useEvent(async () => {
    if (!singerList) {
      return notice.error('请选择歌手');
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return notice.error('请输入名字');
    }

    if (!sq) {
      return notice.error('请选择标准音质文件');
    }

    setLoading(true);
    try {
      const asset = await uploadAsset(sq, AssetType.MUSIC_SQ);
      const id = await createMusic({
        name: trimmedName,
        singerIds: singerList.map((s) => s.id),
        type: musicType,
        sq: asset.id,
      });

      e.emit(EventType.RELOAD_MUSIC_LIST, null);
      playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, { id });

      onClose();
    } catch (error) {
      notice.error(error.message);
    }
    setLoading(false);
  });

  useEffect(() => {
    if (!open) {
      setName('');
      setSingerList([]);
      setMusicType(MusicType.SONG);
      setSq(null);
    }
  }, [open]);

  return (
    <Dialog open={open} maskProps={maskProps}>
      <Title>创建音乐</Title>
      <StyledContent>
        <MultipleSelect
          label="歌手"
          value={singerList}
          onChange={onSingerListChange}
          dataGetter={searchSinger}
          disabled={loading}
          addon={<CreateSinger />}
        />
        <Input
          label="名字"
          inputProps={{
            value: name,
            onChange: onNameChange,
            maxLength: NAME_MAX_LENGTH,
          }}
          disabled={loading}
        />
        <Select
          label="类型"
          data={TYPES}
          value={musicType}
          onChange={onMusicTypeChange}
          disabled={loading}
          addon={<TypeTips>创建后无法更换类型</TypeTips>}
        />
        <FileSelect
          label="标准音质文件"
          value={sq}
          onChange={onSqChange}
          disabled={loading}
          acceptTypes={MUSIC_SQ.ACCEPT_MIMES}
        />
      </StyledContent>
      <Action>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button variant={Variant.PRIMARY} onClick={onCreate} loading={loading}>
          创建
        </Button>
      </Action>
    </Dialog>
  );
}

export default CreateMusicDialog;
