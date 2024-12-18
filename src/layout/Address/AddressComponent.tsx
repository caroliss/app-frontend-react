import React, { useEffect } from 'react';

import { Grid } from '@material-ui/core';

import { Input } from 'src/app-components/Input/Input';
import { Label } from 'src/components/label/Label';
import { FD } from 'src/features/formData/FormDataWrite';
import { useDataModelBindings } from 'src/features/formData/useDataModelBindings';
import { ComponentValidations } from 'src/features/validation/ComponentValidations';
import { useBindingValidationsForNode } from 'src/features/validation/selectors/bindingValidationsForNode';
import { useComponentValidationsForNode } from 'src/features/validation/selectors/componentValidationsForNode';
import { hasValidationErrors } from 'src/features/validation/utils';
import { usePostPlaceQuery } from 'src/hooks/queries/usePostPlaceQuery';
import { useEffectEvent } from 'src/hooks/useEffectEvent';
import classes from 'src/layout/Address/AddressComponent.module.css';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
import type { PropsFromGenericComponent } from 'src/layout';
import type { IDataModelBindingsForAddress } from 'src/layout/Address/config.generated';

export type IAddressProps = PropsFromGenericComponent<'Address'>;

const bindingKeys: { [k in keyof IDataModelBindingsForAddress]: k } = {
  address: 'address',
  postPlace: 'postPlace',
  zipCode: 'zipCode',
  houseNumber: 'houseNumber',
  careOf: 'careOf',
};

export function AddressComponent({ node }: IAddressProps) {
  const { id, required, readOnly, simplified, saveWhileTyping, textResourceBindings, dataModelBindings } =
    useNodeItem(node);

  const bindingValidations = useBindingValidationsForNode(node);
  const componentValidations = useComponentValidationsForNode(node);
  const { formData, setValue } = useDataModelBindings(dataModelBindings, saveWhileTyping);
  const debounce = FD.useDebounceImmediately();
  const { address, careOf, postPlace, zipCode, houseNumber } = formData;

  const updatePostPlace = useEffectEvent((newPostPlace) => {
    if (newPostPlace != null && newPostPlace != postPlace) {
      setValue('postPlace', newPostPlace);
    }
  });

  const zipCodeDebounced = FD.useDebouncedPick(dataModelBindings.zipCode);
  const slowZip = typeof zipCodeDebounced === 'string' ? zipCodeDebounced : undefined;
  const postPlaceQueryData = usePostPlaceQuery(slowZip, !hasValidationErrors(bindingValidations?.zipCode));
  useEffect(() => updatePostPlace(postPlaceQueryData), [postPlaceQueryData, updatePostPlace]);

  return (
    <div
      className={classes.addressComponent}
      key={`address_component_${id}`}
    >
      <div>
        <Label
          node={node}
          overrideId={`address_address_${id}`}
          renderLabelAs='label'
          textResourceBindings={{ title: textResourceBindings?.title ?? 'address_component.address' }}
        >
          <Grid
            item
            id={`form-content-${id}`}
            xs={12}
          >
            <Input
              id={`address_address_${id}`}
              data-bindingkey={bindingKeys.address}
              error={hasValidationErrors(bindingValidations?.address)}
              value={address}
              onChange={(ev) => setValue('address', ev.target.value)}
              onBlur={debounce}
              readOnly={readOnly}
              required={required}
              autoComplete={simplified ? 'street-address' : 'address-line1'}
            />
          </Grid>
        </Label>
        <ComponentValidations validations={bindingValidations?.address} />
      </div>

      {!simplified && (
        <div>
          <Label
            node={node}
            overrideId={`address_care_of_${id}`}
            renderLabelAs='label'
            textResourceBindings={{ title: textResourceBindings?.careOfTitle ?? 'address_component.care_of' }}
          >
            <Grid
              item
              id={`form-content-${id}`}
              xs={12}
            >
              <Input
                id={`address_care_of_${id}`}
                data-bindingkey={bindingKeys.careOf}
                error={hasValidationErrors(bindingValidations?.careOf)}
                value={careOf}
                onChange={(ev) => setValue('careOf', ev.target.value)}
                onBlur={debounce}
                readOnly={readOnly}
                autoComplete='address-line2'
              />
            </Grid>
          </Label>
          <ComponentValidations validations={bindingValidations?.careOf} />
        </div>
      )}

      <Grid
        container
        spacing={6}
      >
        <Grid
          item
          className={`${classes.addressComponentZipCode} ${classes.addressComponentSmallInputs}`}
        >
          <Label
            node={node}
            overrideId={`address_zip_code_${id}`}
            renderLabelAs='label'
            textResourceBindings={{ title: textResourceBindings?.zipCodeTitle ?? 'address_component.zip_code' }}
          >
            <Input
              id={`address_zip_code_${id}`}
              data-bindingkey={bindingKeys.zipCode}
              error={hasValidationErrors(bindingValidations?.zipCode)}
              value={zipCode}
              onChange={(ev) => setValue('zipCode', ev.target.value)}
              onBlur={debounce}
              readOnly={readOnly}
              required={required}
              inputMode='numeric'
              autoComplete='postal-code'
            />
          </Label>
        </Grid>
        <Grid
          item
          className={classes.addressComponentPostplace}
        >
          <Label
            node={node}
            overrideId={`address_post_place_${id}`}
            renderLabelAs='label'
            textResourceBindings={{ title: textResourceBindings?.postPlaceTitle ?? 'address_component.post_place' }}
          >
            <Input
              id={`address_post_place_${id}`}
              data-bindingkey={bindingKeys.postPlace}
              error={hasValidationErrors(bindingValidations?.postPlace)}
              value={postPlace}
              readOnly={true}
              required={required}
              autoComplete='address-level1'
              style={{ width: '100%' }}
            />
          </Label>
        </Grid>
        <ComponentValidations validations={bindingValidations?.zipCode} />
        <ComponentValidations validations={bindingValidations?.postPlace} />
      </Grid>

      {!simplified && (
        <div>
          <Label
            node={node}
            overrideId={`address_house_number_${id}`}
            renderLabelAs='label'
            textResourceBindings={{
              title: textResourceBindings?.houseNumberTitle ?? 'address_component.house_number',
              help: 'address_component.house_number_helper',
            }}
          >
            <div className={classes.addressComponentSmallInputs}>
              <Input
                id={`address_house_number_${id}`}
                data-bindingkey={bindingKeys.houseNumber}
                error={hasValidationErrors(bindingValidations?.houseNumber)}
                value={houseNumber}
                onChange={(ev) => setValue('houseNumber', ev.target.value)}
                onBlur={debounce}
                readOnly={readOnly}
                autoComplete='address-line3'
              />
            </div>
          </Label>
          <ComponentValidations validations={bindingValidations?.houseNumber} />
        </div>
      )}

      <ComponentValidations validations={componentValidations} />
    </div>
  );
}
