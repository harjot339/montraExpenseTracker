import React, {useEffect} from 'react';
import {StyleSheet, Text} from 'react-native';
import {emailRegex, nameRegex, passRegex} from './strings';
import Sapcer from '../components/Spacer';
import Animated, {useSharedValue, withTiming} from 'react-native-reanimated';

export function ConfirmPassError({
  pass,
  confirmPass,
  formKey,
}: Readonly<{
  pass: string;
  confirmPass: string;
  formKey: boolean;
}>) {
  return (
    <>
      {confirmPass !== '' && confirmPass !== pass ? (
        <Text style={style.error}>Password do not match</Text>
      ) : confirmPass === '' && formKey ? (
        <Text style={style.error}>Confirm Password cannot be Empty</Text>
      ) : (
        <Sapcer height={25} />
      )}
    </>
  );
}
export function testInput(re: RegExp, str: string): boolean {
  return re.test(str);
}

export function PassValidationError({
  pass,
  formKey,
}: Readonly<{pass: string; formKey: boolean}>) {
  const height = useSharedValue(25);
  useEffect(() => {
    if (!!pass && !testInput(passRegex, pass)) {
      height.value = withTiming(40);
    } else {
      height.value = withTiming(25);
    }
    console.log(height);
  }, [pass, formKey]);
  return (
    <>
      {!!pass && !testInput(passRegex, pass) ? (
        <Animated.Text style={[style.error, {height}]} numberOfLines={2}>
          Password must contain atleast 1 Uppercase, 1 Lowercase, 1 Numeric and
          1 Symbol Character
        </Animated.Text>
      ) : pass === '' && formKey ? (
        <Animated.Text style={[style.error, {height}]}>
          Password cannot be Empty
        </Animated.Text>
      ) : (
        <Animated.View style={{height}}></Animated.View>
      )}
    </>
  );
}

export function PassEmptyError({
  pass,
  formKey,
}: Readonly<{
  pass: string;
  formKey: boolean;
}>) {
  return (
    <>
      {pass === '' && formKey ? (
        <Text style={style.error}>Password cannot be Empty</Text>
      ) : (
        <Sapcer height={25} />
      )}
    </>
  );
}

export function EmailValError({
  email,
  formKey,
}: Readonly<{
  email: string;
  formKey: boolean;
}>) {
  return (
    <>
      {!!email && !testInput(emailRegex, email) ? (
        <Text style={style.error}>Email is not Valid</Text>
      ) : email === '' && formKey ? (
        <Text style={style.error}>Email cannot be Empty</Text>
      ) : (
        <Sapcer height={25} />
      )}
    </>
  );
}
export function EmailEmptyError({
  email,
  formKey,
}: Readonly<{
  email: string;
  formKey: boolean;
}>) {
  return (
    <>
      {email === '' && formKey ? (
        <Text style={style.error}>Email cannot be Empty</Text>
      ) : (
        <Sapcer height={25} />
      )}
    </>
  );
}

export function NameValError({
  name,
  formKey,
}: Readonly<{
  name: string;
  formKey: boolean;
}>) {
  return (
    <>
      {!!name && !testInput(nameRegex, name) ? (
        <Text style={style.error}>Name is not Valid</Text>
      ) : name === '' && formKey ? (
        <Text style={style.error}>Name cannot be Empty</Text>
      ) : (
        <Sapcer height={25} />
      )}
    </>
  );
}
export function CompundEmptyError({
  value1,
  value2,
  formKey,
  errorText,
  color = 'rgb(255,51,51)',
  size = 12,
}: Readonly<{
  value1: string;
  value2: string;
  formKey: boolean;
  errorText: string;
  color?: string;
  size?: number;
}>) {
  return (
    <>
      {(value1 === '' || value2 === '') && formKey ? (
        <Text style={[style.error, {color: color, fontSize: size}]}>
          {errorText}
        </Text>
      ) : (
        <Sapcer height={24} />
      )}
    </>
  );
}
export function EmptyError({
  value,
  formKey,
  errorText,
  color = 'rgb(255,51,51)',
  size = 12,
}: Readonly<{
  value: string;
  formKey: boolean;
  errorText: string;
  color?: string;
  size?: number;
}>) {
  return (
    <>
      {value === '' && formKey ? (
        <Text style={[style.error, {color: color, fontSize: size, height: 24}]}>
          {errorText}
        </Text>
      ) : (
        <Sapcer height={24} />
      )}
    </>
  );
}

const style = StyleSheet.create({
  error: {
    color: 'rgb(255,51,51)',
    fontSize: 12,
    paddingLeft: 12,
    paddingTop: 3,
    // justifyContent:"flex-end",
    alignSelf: 'flex-start',
    height: 25,
  },
});
