import {View, TextInput, Pressable} from 'react-native';
import styles from './styles';
import {useState} from 'react';
import {COLORS} from '../../constants/commonStyles';
import {ICONS} from '../../constants/icons';

function CustomPassInput({
  value,
  onChangeText,
  placeholderText,
  inputColor = 'black',
}: Readonly<{
  value: string | undefined;
  onChangeText: (str: string) => void;
  placeholderText: string;
  eyeColor?: string;
  inputColor?: string;
}>) {
  const [showPass, setShowPass] = useState(true);
  return (
    <View style={styles.passInputContainer}>
      <TextInput
        style={[styles.passInput, {color: inputColor}]}
        placeholder={placeholderText}
        secureTextEntry={showPass}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={COLORS.DARK[25]}
        textContentType="oneTimeCode"
      />
      <Pressable
        onPress={() => {
          setShowPass(pass => !pass);
        }}>
        {showPass
          ? ICONS.Show({height: 20, width: 20, color: 'white'})
          : ICONS.Hide({height: 18, width: 18, color: 'white'})}
      </Pressable>
    </View>
  );
}
export default CustomPassInput;
