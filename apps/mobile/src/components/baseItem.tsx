import React, {PropsWithChildren} from 'react';
import {ImageSourcePropType} from 'react-native';
import {Box, Image, HStack} from 'native-base';

type Props = {
  alt: string;
  source?: ImageSourcePropType;
  backgroundColor?: string;
};

export const BaseItem = ({
  source,
  alt,
  backgroundColor = 'background.3',
  children,
}: PropsWithChildren<Props>) => {
  return (
    <HStack
      bg={backgroundColor}
      borderRadius="8px"
      w="100%"
      space="12px"
      justifyContent="center"
      alignItems="center"
      py="13px"
      px="16px">
      {source ? (
        <Image source={source} alt={alt} w="40px" h="40px" />
      ) : undefined}
      <Box flex={1}>{children}</Box>
    </HStack>
  );
};
